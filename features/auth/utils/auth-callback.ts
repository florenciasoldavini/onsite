export type SupportedOAuthProvider = "apple" | "google";

export type AuthCallbackIntent =
  | { kind: "identity-link"; provider: SupportedOAuthProvider }
  | { kind: "sign-in" };

type IdentityLike = {
  provider: string;
};

const identityLinkAction = "identity-link";

export function getOAuthProviderLabel(provider: SupportedOAuthProvider) {
  return provider === "google" ? "Google" : "Apple";
}

export function getIdentityLinkCallbackParams(
  provider: SupportedOAuthProvider
) {
  return {
    auth_action: identityLinkAction,
    next: "/profile",
    provider
  };
}

export function getSupportedOAuthProvider(
  value: string | string[] | null | undefined
): SupportedOAuthProvider | null {
  const provider = Array.isArray(value) ? value[0] : value;

  return provider === "apple" || provider === "google" ? provider : null;
}

export function getAuthCallbackIntent(
  params: URLSearchParams
): AuthCallbackIntent {
  const provider = getSupportedOAuthProvider(params.get("provider"));

  if (params.get("auth_action") === identityLinkAction && provider) {
    return { kind: "identity-link", provider };
  }

  return { kind: "sign-in" };
}

export function getSafePostAuthRedirectPath(
  nextPath: string | string[] | null | undefined
) {
  const candidate = Array.isArray(nextPath) ? nextPath[0] : nextPath;

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/";
  }

  return candidate;
}

export function getPostAuthRedirectPath(
  authType: string | null,
  nextPath: string | null = null,
  intent: AuthCallbackIntent = { kind: "sign-in" }
) {
  if (authType === "recovery") {
    return "/reset-password";
  }

  if (intent.kind === "identity-link") {
    const query = new URLSearchParams({
      identity_link_check: intent.provider
    });

    return `/profile?${query.toString()}`;
  }

  return getSafePostAuthRedirectPath(nextPath);
}

export function isIdentityProviderLinked(
  identities: IdentityLike[],
  provider: SupportedOAuthProvider
) {
  return identities.some(
    (identity) => identity.provider.toLowerCase() === provider
  );
}
