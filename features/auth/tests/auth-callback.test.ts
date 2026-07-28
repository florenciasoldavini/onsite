import {
  getAuthCallbackIntent,
  getIdentityLinkCallbackParams,
  getPostAuthRedirectPath,
  getSupportedOAuthProvider,
  isIdentityProviderLinked
} from "@/features/auth/utils/auth-callback";

describe("auth callback intent", () => {
  it("recognizes an app-generated identity-link callback", () => {
    const params = new URLSearchParams({
      auth_action: "identity-link",
      provider: "google"
    });

    expect(getAuthCallbackIntent(params)).toEqual({
      kind: "identity-link",
      provider: "google"
    });
  });

  it("treats unsupported or incomplete callback metadata as sign-in", () => {
    expect(
      getAuthCallbackIntent(
        new URLSearchParams({
          auth_action: "identity-link",
          provider: "github"
        })
      )
    ).toEqual({ kind: "sign-in" });
    expect(
      getAuthCallbackIntent(new URLSearchParams({ provider: "apple" }))
    ).toEqual({ kind: "sign-in" });
  });
});

describe("post-auth redirects", () => {
  it("returns identity-link callbacks to profile for verification", () => {
    expect(
      getPostAuthRedirectPath(null, "/projects", {
        kind: "identity-link",
        provider: "apple"
      })
    ).toBe("/profile?identity_link_check=apple");
  });

  it("keeps password recovery authoritative over callback metadata", () => {
    expect(
      getPostAuthRedirectPath("recovery", "/profile", {
        kind: "identity-link",
        provider: "google"
      })
    ).toBe("/reset-password");
  });

  it("allows safe app paths and rejects external redirects", () => {
    expect(getPostAuthRedirectPath(null, "/profile")).toBe("/profile");
    expect(getPostAuthRedirectPath(null, "//example.com/account")).toBe("/");
    expect(getPostAuthRedirectPath(null, "https://example.com/account")).toBe(
      "/"
    );
  });
});

describe("identity-link helpers", () => {
  it("builds the callback metadata used by the linking flow", () => {
    expect(getIdentityLinkCallbackParams("google")).toEqual({
      auth_action: "identity-link",
      next: "/profile",
      provider: "google"
    });
  });

  it("normalizes supported provider route parameters", () => {
    expect(getSupportedOAuthProvider(["apple", "google"])).toBe("apple");
    expect(getSupportedOAuthProvider("google")).toBe("google");
    expect(getSupportedOAuthProvider("github")).toBeNull();
  });

  it("only confirms providers returned by Supabase", () => {
    const identities = [{ provider: "email" }, { provider: "Google" }];

    expect(isIdentityProviderLinked(identities, "google")).toBe(true);
    expect(isIdentityProviderLinked(identities, "apple")).toBe(false);
  });
});
