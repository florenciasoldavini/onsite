import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildAuthProfile,
  deliverWelcomeEmailIfNeeded,
  hydrateAuthUser
} from "@/features/auth/services/auth-session.service";
import type { User } from "@/features/auth/types/auth.types";
import type { Session } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  findAuthProfileById: vi.fn(),
  insertAuthProfile: vi.fn(),
  sendWelcomeEmail: vi.fn(),
  updateAuthProfileBackfill: vi.fn()
}));

vi.mock("@/features/auth/repositories/auth-profile.repository", () => ({
  AuthProfileRepositoryError: class AuthProfileRepositoryError extends Error {},
  findAuthProfileById: mocks.findAuthProfileById,
  insertAuthProfile: mocks.insertAuthProfile,
  updateAuthProfileBackfill: mocks.updateAuthProfileBackfill
}));

vi.mock("@/features/auth/repositories/auth.repository", () => ({
  getCurrentAuthSession: vi.fn(),
  isAuthSessionAvailable: vi.fn(() => true),
  observeAuthSession: vi.fn(),
  signOutAuthSession: vi.fn()
}));

vi.mock("@/features/profile/services/profile.service", () => ({
  saveProfile: vi.fn()
}));

vi.mock("@/features/auth/services/welcome-email.service", () => ({
  sendWelcomeToOnzaitEmail: mocks.sendWelcomeEmail
}));

vi.mock("@/infrastructure/monitoring/sentry", () => ({
  Sentry: { captureException: mocks.captureException }
}));

const session = {
  user: {
    email: "BUILDER@EXAMPLE.COM",
    id: "user-1",
    identities: [
      {
        identity_data: {
          avatar_url: "https://example.com/avatar.png",
          family_name: "Builder",
          given_name: "Alex",
          role: "admin"
        }
      }
    ],
    user_metadata: {}
  }
} as unknown as Session;

const user = {
  avatar: null,
  created_at: new Date("2026-01-01"),
  deleted_at: null,
  email: "builder@example.com",
  first_name: "builder",
  id: "user-1",
  last_name: null,
  phone_number: null,
  role: "user",
  updated_at: null,
  welcome_email_sent_at: null
} satisfies User;

describe("auth session service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a normalized profile without accepting metadata roles", () => {
    expect(buildAuthProfile(session)).toEqual({
      avatar: "https://example.com/avatar.png",
      email: "builder@example.com",
      first_name: "Alex",
      id: "user-1",
      last_name: "Builder",
      phone_number: null,
      role: "user"
    });
  });

  it("creates a profile when an authenticated user has no profile row", async () => {
    mocks.findAuthProfileById.mockResolvedValue(null);
    mocks.insertAuthProfile.mockResolvedValue(user);

    await expect(hydrateAuthUser(session)).resolves.toEqual(user);
    expect(mocks.insertAuthProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1", role: "user" })
    );
  });

  it("backfills missing profile metadata through the repository", async () => {
    const updatedUser = {
      ...user,
      avatar: "https://example.com/avatar.png",
      first_name: "Alex",
      last_name: "Builder"
    };
    mocks.findAuthProfileById.mockResolvedValue(user);
    mocks.updateAuthProfileBackfill.mockResolvedValue(updatedUser);

    await expect(hydrateAuthUser(session)).resolves.toEqual(updatedUser);
    expect(mocks.updateAuthProfileBackfill).toHaveBeenCalledWith({
      profile: {
        avatar: "https://example.com/avatar.png",
        first_name: "Alex",
        last_name: "Builder"
      },
      userId: "user-1"
    });
  });

  it("keeps a valid profile usable when optional metadata backfill fails", async () => {
    mocks.findAuthProfileById.mockResolvedValue(user);
    mocks.updateAuthProfileBackfill.mockRejectedValue(
      new Error("database unavailable")
    );

    await expect(hydrateAuthUser(session)).resolves.toEqual(user);
    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { auth_profile: "metadata-backfill" } })
    );
  });

  it("updates welcome state while keeping provider failures non-blocking", async () => {
    mocks.sendWelcomeEmail.mockResolvedValueOnce({
      welcome_email_sent_at: "2026-07-21T12:00:00.000Z"
    });

    const welcomedUser = await deliverWelcomeEmailIfNeeded({
      ...user,
      id: "welcome-success"
    });

    expect(welcomedUser.welcome_email_sent_at).toEqual(
      new Date("2026-07-21T12:00:00.000Z")
    );

    mocks.sendWelcomeEmail.mockRejectedValueOnce(new Error("provider details"));
    const unchangedUser = { ...user, id: "welcome-failure" };

    await expect(deliverWelcomeEmailIfNeeded(unchangedUser)).resolves.toEqual(
      unchangedUser
    );
    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { auth_profile: "welcome-email" } })
    );
  });
});
