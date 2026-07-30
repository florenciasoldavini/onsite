import { AuthRepositoryError } from "@/features/auth/errors/auth.errors";
import {
  beginOAuthSignIn,
  changePassword,
  clearCompletedWebAuthCallback,
  completeAuthCallback,
  getAuthCallbackUrl,
  hasAuthCallbackPayload,
  parseAuthCallbackParams,
  requestPasswordReset,
  resendVerificationEmail,
  signInWithEmailPassword,
  signUpWithEmailPassword
} from "@/features/auth/repositories/auth.repository";
import {
  getAuthCallbackIntent,
  getPostAuthRedirectPath,
  type AuthCallbackIntent,
  type SupportedOAuthProvider
} from "@/features/auth/utils/auth-callback";
import {
  UserFacingError,
  getUserFacingErrorMessage
} from "@/shared/utils/user-facing-errors";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type EmailSignInResult =
  | { status: "signed-in" }
  | { email: string; status: "email-unverified" };

export async function signInWithEmail({
  email,
  password
}: {
  email: string;
  password: string;
}): Promise<EmailSignInResult> {
  const normalizedEmail = normalizeEmail(email);

  try {
    await signInWithEmailPassword({ email: normalizedEmail, password });
    return { status: "signed-in" };
  } catch (error) {
    if (
      error instanceof AuthRepositoryError &&
      error.code === "email-not-confirmed"
    ) {
      return { email: normalizedEmail, status: "email-unverified" };
    }

    throw error;
  }
}

export type EmailSignUpResult =
  | { status: "signed-in" }
  | { email: string; status: "verification-rate-limited" }
  | { email: string; status: "verification-sent" };

export async function signUpWithEmail({
  email,
  language = "es",
  next,
  password
}: {
  email: string;
  language?: "es" | "en";
  next?: string;
  password: string;
}): Promise<EmailSignUpResult> {
  const normalizedEmail = normalizeEmail(email);

  try {
    const { session } = await signUpWithEmailPassword({
      email: normalizedEmail,
      language,
      next,
      password
    });

    return session
      ? { status: "signed-in" }
      : { email: normalizedEmail, status: "verification-sent" };
  } catch (error) {
    if (
      error instanceof AuthRepositoryError &&
      error.code === "email-cooldown"
    ) {
      return {
        email: normalizedEmail,
        status: "verification-rate-limited"
      };
    }

    throw error;
  }
}

export function signInWithOAuth({
  next,
  provider
}: {
  next?: string;
  provider: SupportedOAuthProvider;
}) {
  return beginOAuthSignIn(provider, next);
}

export function sendPasswordReset(email: string, language: "es" | "en" = "es") {
  return requestPasswordReset(normalizeEmail(email), language);
}

export function updateAccountPassword(password: string) {
  return changePassword(password);
}

export async function resendEmailVerification(
  input: string | { email: string; next?: string },
  language: "es" | "en" = "es"
) {
  const email = typeof input === "string" ? input : input.email;
  const next = typeof input === "string" ? undefined : input.next;
  try {
    const normalizedEmail = normalizeEmail(email);
    if (next) {
      await resendVerificationEmail(normalizedEmail, language, next);
    } else {
      await resendVerificationEmail(normalizedEmail, language);
    }
    return { status: "sent" } as const;
  } catch (error) {
    if (
      error instanceof AuthRepositoryError &&
      error.code === "email-cooldown"
    ) {
      return { status: "rate-limited" } as const;
    }

    throw error;
  }
}

export async function preparePasswordRecovery(linkingUrl: string | null) {
  const activeUrl = getAuthCallbackUrl(linkingUrl);

  if (!activeUrl || !hasAuthCallbackPayload(activeUrl)) {
    return { shouldUpdatePassword: false };
  }

  const { session, type } = await completeAuthCallback(activeUrl);
  clearCompletedWebAuthCallback();

  return {
    shouldUpdatePassword: type === "recovery" || Boolean(session)
  };
}

export class AuthCallbackError extends UserFacingError {
  constructor(
    message: string,
    readonly intent: AuthCallbackIntent,
    cause?: unknown
  ) {
    super(message, cause);
    this.name = "AuthCallbackError";
  }
}

export async function finishAuthCallback(linkingUrl: string | null) {
  const activeUrl = getAuthCallbackUrl(linkingUrl);

  if (!activeUrl) {
    throw new AuthCallbackError(
      "This auth link is missing the session payload. Try signing in again.",
      { kind: "sign-in" }
    );
  }

  const params = parseAuthCallbackParams(activeUrl);
  const intent = getAuthCallbackIntent(params);

  if (!hasAuthCallbackPayload(activeUrl)) {
    throw new AuthCallbackError(
      intent.kind === "identity-link"
        ? "This link is missing the account confirmation payload. Try linking again."
        : "This auth link is missing the session payload. Try signing in again.",
      intent
    );
  }

  try {
    const { type } = await completeAuthCallback(activeUrl);
    clearCompletedWebAuthCallback();

    return {
      intent,
      redirectPath: getPostAuthRedirectPath(type, params.get("next"), intent)
    };
  } catch (error) {
    throw new AuthCallbackError(
      getUserFacingErrorMessage(
        error,
        intent.kind === "identity-link"
          ? "We couldn't finish linking this sign-in method. Try again."
          : "We couldn't finish signing you in. Try again."
      ),
      intent,
      error
    );
  }
}
