import { AuthRepositoryError } from "@/features/auth/errors/auth.errors";
import {
  clearWebAuthUrlArtifacts,
  completeAuthSessionFromUrl,
  getActiveAuthUrl,
  getAuthParamsFromUrl,
  getAuthRedirectUrl,
  resendSignUpConfirmationEmail,
  sendPasswordResetEmail,
  startOAuthSignIn,
  updatePassword,
  urlHasAuthPayload
} from "@/features/auth/repositories/auth-transport.repository";
import type { SupportedOAuthProvider } from "@/features/auth/utils/auth-callback";
import {
  getSupabaseErrorMessage,
  isSupabaseEmailCooldownError,
  isSupabaseEmailNotConfirmedError,
  supabase
} from "@/infrastructure/supabase/client";

function requireAuthClient() {
  if (!supabase) {
    throw new AuthRepositoryError(
      getSupabaseErrorMessage("Supabase is not configured.")
    );
  }

  return supabase.auth;
}

function toAuthRepositoryError(error: unknown) {
  if (error instanceof AuthRepositoryError) {
    return error;
  }

  const code = isSupabaseEmailNotConfirmedError(error)
    ? "email-not-confirmed"
    : isSupabaseEmailCooldownError(error)
      ? "email-cooldown"
      : "unknown";

  return new AuthRepositoryError(getSupabaseErrorMessage(error), code, error);
}

async function runAuthRequest<T>(request: () => Promise<T>) {
  try {
    return await request();
  } catch (error) {
    throw toAuthRepositoryError(error);
  }
}

export async function signInWithEmailPassword({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  return runAuthRequest(async () => {
    const { data, error } = await requireAuthClient().signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return data;
  });
}

export async function signUpWithEmailPassword({
  email,
  language = "es",
  next,
  password
}: {
  email: string;
  language?: "es" | "en";
  next?: string;
  password: string;
}) {
  return runAuthRequest(async () => {
    const { data, error } = await requireAuthClient().signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(
          "callback",
          next ? { lang: language, next } : { lang: language }
        )
      }
    });

    if (error) {
      throw error;
    }

    return data;
  });
}

export function beginOAuthSignIn(
  provider: SupportedOAuthProvider,
  next?: string
) {
  return runAuthRequest(() => startOAuthSignIn(provider, next));
}

export function requestPasswordReset(
  email: string,
  language: "es" | "en" = "es"
) {
  return runAuthRequest(() => sendPasswordResetEmail(email, language));
}

export function resendVerificationEmail(
  email: string,
  language: "es" | "en" = "es",
  next?: string
) {
  return runAuthRequest(() =>
    next
      ? resendSignUpConfirmationEmail(email, language, next)
      : resendSignUpConfirmationEmail(email, language)
  );
}

export function changePassword(password: string) {
  return runAuthRequest(() => updatePassword(password));
}

export function getAuthCallbackUrl(linkingUrl: string | null) {
  return getActiveAuthUrl(linkingUrl);
}

export function hasAuthCallbackPayload(url: string) {
  return urlHasAuthPayload(url);
}

export function parseAuthCallbackParams(url: string) {
  return getAuthParamsFromUrl(url);
}

export function completeAuthCallback(url: string) {
  return runAuthRequest(() => completeAuthSessionFromUrl(url));
}

export function clearCompletedWebAuthCallback() {
  clearWebAuthUrlArtifacts();
}

export function isAuthSessionAvailable() {
  return Boolean(supabase);
}

export async function getCurrentAuthSession() {
  return runAuthRequest(async () => {
    const { data, error } = await requireAuthClient().getSession();

    if (error) {
      throw error;
    }

    return data.session;
  });
}

export function observeAuthSession(
  listener: (session: import("@supabase/supabase-js").Session | null) => void
) {
  const {
    data: { subscription }
  } = requireAuthClient().onAuthStateChange((_event, session) => {
    listener(session);
  });

  return () => subscription.unsubscribe();
}

export async function signOutAuthSession() {
  return runAuthRequest(async () => {
    const { error } = await requireAuthClient().signOut();

    if (error) {
      throw error;
    }
  });
}
