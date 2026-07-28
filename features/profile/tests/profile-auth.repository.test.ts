import {
  getProfileUserIdentities,
  linkProfileOAuthIdentity,
  updateProfilePassword
} from "@/features/profile/repositories/profile-auth.repository";

const mockAuth = {
  getUserIdentities: jest.fn(),
  startOAuthIdentityLink: jest.fn(),
  updatePassword: jest.fn()
};

jest.mock("@/features/auth/repositories/auth-transport.repository", () => ({
  get startOAuthIdentityLink() {
    return mockAuth.startOAuthIdentityLink;
  },
  get updatePassword() {
    return mockAuth.updatePassword;
  }
}));

jest.mock("@/infrastructure/supabase/client", () => ({
  getSupabaseErrorMessage: () =>
    "We couldn't load your sign-in methods. Try again.",
  supabase: {
    auth: {
      get getUserIdentities() {
        return mockAuth.getUserIdentities;
      }
    }
  }
}));

describe("profile auth repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the identities reported by Supabase Auth", async () => {
    const identities = [{ id: "google-id", provider: "google" }];
    mockAuth.getUserIdentities.mockResolvedValue({
      data: { identities },
      error: null
    });

    await expect(getProfileUserIdentities()).resolves.toEqual(identities);
  });

  it("normalizes identity lookup errors at the repository boundary", async () => {
    mockAuth.getUserIdentities.mockResolvedValue({
      data: { identities: [] },
      error: new Error("Identity lookup failed")
    });

    await expect(getProfileUserIdentities()).rejects.toThrow(
      "We couldn't load your sign-in methods. Try again."
    );
  });

  it("delegates OAuth linking to the shared cross-platform auth transport", async () => {
    mockAuth.startOAuthIdentityLink.mockResolvedValue({ provider: "google" });

    await expect(linkProfileOAuthIdentity("google")).resolves.toEqual({
      provider: "google"
    });
    expect(mockAuth.startOAuthIdentityLink).toHaveBeenCalledWith("google");
  });

  it("delegates password changes to the shared auth transport", async () => {
    mockAuth.updatePassword.mockResolvedValue({ user: { id: "user-id" } });

    await expect(updateProfilePassword("new-password")).resolves.toEqual({
      user: { id: "user-id" }
    });
    expect(mockAuth.updatePassword).toHaveBeenCalledWith("new-password");
  });
});
