import {
  getIdentityLinkCallbackParams,
  getOAuthProviderLabel,
  type SupportedOAuthProvider
} from "@/features/auth/utils/auth-callback";
import {
  getSupabaseErrorMessage,
  supabase
} from "@/infrastructure/supabase/client";
import {
  UserFacingError,
  toUserFacingError
} from "@/shared/utils/user-facing-errors";
import type { Session } from "@supabase/supabase-js";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export type { SupportedOAuthProvider } from "@/features/auth/utils/auth-callback";

export interface AuthRedirectResult {
  session: Session | null;
  type: string | null;
}

function getConfiguredSiteUrl() {
  const configuredSiteUrl = process.env.EXPO_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return null;
}

function getBrowserOrigin() {
  if (typeof window === "undefined" || !window.location.origin) {
    return null;
  }

  return window.location.origin.replace(/\/+$/, "");
}

function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function getNativeAuthRedirectUrl(
  path: "callback" | "reset-password",
  queryParams?: Record<string, string>
) {
  return Linking.createURL(path, {
    queryParams,
    scheme: isExpoGo() ? "exp" : "onzait"
  });
}

function getCombinedSearchParams(url: URL) {
  const searchParams = new URLSearchParams(url.search);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));

  for (const [key, value] of hashParams.entries()) {
    if (!searchParams.has(key)) {
      searchParams.set(key, value);
    }
  }

  return searchParams;
}

export function getAuthRedirectUrl(
  path: "callback" | "reset-password" = "callback",
  queryParams?: Record<string, string>
) {
  if (Platform.OS === "web") {
    const siteUrl = getBrowserOrigin() ?? getConfiguredSiteUrl();

    if (!siteUrl) {
      throw new UserFacingError(
        "Authentication is temporarily unavailable. Try again later.",
        new Error(
          "Missing EXPO_PUBLIC_SITE_URL for a hosted authentication redirect."
        )
      );
    }

    const searchParams = new URLSearchParams(queryParams);
    const search = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

    return `${siteUrl}/${path}${search}`;
  }

  return getNativeAuthRedirectUrl(path, queryParams);
}

export function getAuthParamsFromUrl(url: string) {
  return getCombinedSearchParams(new URL(url));
}

export function urlHasAuthPayload(url: string) {
  const params = getAuthParamsFromUrl(url);

  return (
    params.has("access_token") ||
    params.has("refresh_token") ||
    params.has("code") ||
    params.has("error") ||
    params.has("error_description") ||
    params.has("type")
  );
}

export function getActiveAuthUrl(linkingUrl: string | null) {
  if (linkingUrl) {
    return linkingUrl;
  }

  if (typeof window !== "undefined") {
    return window.location.href;
  }

  return null;
}

export async function completeAuthSessionFromUrl(
  url: string
): Promise<AuthRedirectResult> {
  if (!supabase) {
    throw new Error(getSupabaseErrorMessage("Supabase is not configured."));
  }

  const params = getAuthParamsFromUrl(url);
  const authType = params.get("type");
  const errorDescription =
    params.get("error_description") ?? params.get("error");
  const code = params.get("code");
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (errorDescription) {
    throw toUserFacingError(
      { code: params.get("error_code"), message: errorDescription },
      "We couldn't complete the authentication request. Try again."
    );
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    return { session: data.session, type: authType };
  }

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (error) {
      throw error;
    }

    return { session: data.session, type: authType };
  }

  return { session: null, type: authType };
}

export async function startOAuthSignIn(
  provider: SupportedOAuthProvider,
  next?: string
) {
  if (!supabase) {
    throw new Error(getSupabaseErrorMessage("Supabase is not configured."));
  }

  const redirectTo = getAuthRedirectUrl(
    "callback",
    next ? { next } : undefined
  );
  const providerLabel = getOAuthProviderLabel(provider);

  if (Platform.OS === "web") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    });

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true
    }
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new UserFacingError(
      `We couldn't start ${providerLabel} sign-in. Try again.`,
      new Error("Supabase did not return an OAuth URL for native sign-in.")
    );
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === "cancel" || result.type === "dismiss") {
    throw new UserFacingError(`${providerLabel} sign-in was canceled.`);
  }

  if (result.type !== "success" || !("url" in result) || !result.url) {
    throw new UserFacingError(
      `We couldn't finish ${providerLabel} sign-in. Try again.`,
      new Error(
        `Native OAuth sign-in did not return a success URL. Redirect: ${redirectTo}; Expo Go: ${isExpoGo()}.`
      )
    );
  }

  return completeAuthSessionFromUrl(result.url);
}

export async function startOAuthIdentityLink(provider: SupportedOAuthProvider) {
  if (!supabase) {
    throw new Error(getSupabaseErrorMessage("Supabase is not configured."));
  }

  const redirectTo = getAuthRedirectUrl(
    "callback",
    getIdentityLinkCallbackParams(provider)
  );
  const providerLabel = getOAuthProviderLabel(provider);

  if (Platform.OS === "web") {
    const { data, error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo }
    });

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true
    }
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new UserFacingError(
      `We couldn't start linking your ${providerLabel} account. Try again.`,
      new Error(
        "Supabase did not return an OAuth URL for native identity linking."
      )
    );
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === "cancel" || result.type === "dismiss") {
    throw new UserFacingError(`${providerLabel} account linking was canceled.`);
  }

  if (result.type !== "success" || !("url" in result) || !result.url) {
    throw new UserFacingError(
      `We couldn't finish linking your ${providerLabel} account. Try again.`,
      new Error(
        `Native identity linking did not return a success URL. Redirect: ${redirectTo}; Expo Go: ${isExpoGo()}.`
      )
    );
  }

  return completeAuthSessionFromUrl(result.url);
}

export async function sendPasswordResetEmail(
  email: string,
  language: "es" | "en"
) {
  if (!supabase) {
    throw new Error(getSupabaseErrorMessage("Supabase is not configured."));
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl("reset-password", { lang: language })
  });

  if (error) {
    throw error;
  }
}

export async function resendSignUpConfirmationEmail(
  email: string,
  language: "es" | "en",
  next?: string
) {
  if (!supabase) {
    throw new Error(getSupabaseErrorMessage("Supabase is not configured."));
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
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
}

export async function updatePassword(password: string) {
  if (!supabase) {
    throw new Error(getSupabaseErrorMessage("Supabase is not configured."));
  }

  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw error;
  }

  return data;
}

export function clearWebAuthUrlArtifacts() {
  const origin = getBrowserOrigin();

  if (typeof window === "undefined" || !origin) {
    return;
  }

  const cleanUrl = `${origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
}
