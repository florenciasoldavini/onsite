import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  startOAuthIdentityLink,
  startOAuthSignIn
} from "@/features/auth/repositories/auth-transport.repository";

const mocks = vi.hoisted(() => ({
  linkIdentity: vi.fn(),
  openAuthSessionAsync: vi.fn(),
  signInWithOAuth: vi.fn()
}));

vi.mock("@/infrastructure/supabase/client", () => ({
  getSupabaseErrorMessage: () =>
    "We couldn't complete this request. Please try again.",
  supabase: {
    auth: {
      linkIdentity: mocks.linkIdentity,
      signInWithOAuth: mocks.signInWithOAuth
    }
  }
}));

vi.mock("expo-constants", () => ({
  default: { executionEnvironment: "standalone" },
  ExecutionEnvironment: { StoreClient: "store-client" }
}));

vi.mock("expo-linking", () => ({
  createURL: vi.fn((path: string) => `onzait://${path}`)
}));

vi.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: vi.fn(),
  openAuthSessionAsync: mocks.openAuthSessionAsync
}));

vi.mock("react-native", () => ({
  Platform: { OS: "ios" }
}));

describe("native OAuth product errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not expose Supabase response details when sign-in cannot start", async () => {
    mocks.signInWithOAuth.mockResolvedValue({ data: {}, error: null });

    await expect(startOAuthSignIn("google")).rejects.toMatchObject({
      message: "We couldn't start Google sign-in. Try again."
    });
  });

  it("represents a canceled sign-in without redirect configuration advice", async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: "https://provider.example/auth" },
      error: null
    });
    mocks.openAuthSessionAsync.mockResolvedValue({ type: "cancel" });

    await expect(startOAuthSignIn("apple")).rejects.toMatchObject({
      message: "Apple sign-in was canceled."
    });
  });

  it("keeps identity-link redirect diagnostics out of product copy", async () => {
    mocks.linkIdentity.mockResolvedValue({
      data: { url: "https://provider.example/auth" },
      error: null
    });
    mocks.openAuthSessionAsync.mockResolvedValue({ type: "locked" });

    await expect(startOAuthIdentityLink("google")).rejects.toMatchObject({
      message: "We couldn't finish linking your Google account. Try again."
    });
  });
});
