import englishShared from "@/shared/i18n/en";
import spanishShared from "@/shared/i18n/es";
import type { SupportedLanguage } from "@/features/localization/types/language";

const genericErrorResources = {
  en: englishShared.genericErrors,
  es: spanishShared.genericErrors
} as const;

type GenericErrorKey = keyof typeof englishShared.genericErrors;

let currentUserFacingLanguage: SupportedLanguage = "en";

export function setUserFacingErrorLanguage(language: SupportedLanguage) {
  currentUserFacingLanguage = language;
}

function genericError(key: GenericErrorKey) {
  return genericErrorResources[currentUserFacingLanguage][key];
}

export class UserFacingError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "UserFacingError";
    this.cause = cause;
  }
}

export function getUserFacingErrorMessage(error: unknown, fallback: string) {
  if (error instanceof UserFacingError) {
    return currentUserFacingLanguage === "en" ? error.message : fallback;
  }

  const code = getErrorField(error, "code")?.toLowerCase();
  const name = getErrorField(error, "name")?.toLowerCase();
  const storageError = getErrorField(error, "error")?.toLowerCase();
  const status = getErrorStatus(error);

  if (code === "invalid_credentials") {
    return genericError("invalidCredentials");
  }

  if (code === "email_not_confirmed") {
    return genericError("unconfirmedEmail");
  }

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    code === "23505"
  ) {
    return genericError("alreadyExists");
  }

  if (code === "weak_password") {
    return genericError("weakPassword");
  }

  if (code === "same_password") {
    return genericError("differentPassword");
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    status === 429
  ) {
    return genericError("rateLimited");
  }

  if (code === "manual_linking_disabled") {
    return genericError("linkingDisabled");
  }

  if (code === "identity_already_exists") {
    return genericError("methodAlreadyLinked");
  }

  if (code === "provider_disabled") {
    return genericError("methodUnavailable");
  }

  if (
    code === "session_not_found" ||
    code === "refresh_token_not_found" ||
    code === "refresh_token_already_used"
  ) {
    return genericError("sessionExpired");
  }

  if (code === "42501" || status === 401 || status === 403) {
    return genericError("permission");
  }

  if (code === "23503") {
    return genericError("inUse");
  }

  if (
    code?.startsWith("08") ||
    code === "pgrst000" ||
    code === "pgrst001" ||
    code === "pgrst002" ||
    code === "pgrst003" ||
    (status !== null && status >= 500)
  ) {
    return genericError("serviceUnavailable");
  }

  if (name === "duplicate" || storageError === "duplicate") {
    return genericError("fileDuplicate");
  }

  if (name === "notfound" || storageError === "notfound" || status === 404) {
    return genericError("notFound");
  }

  if (status === 413) {
    return genericError("fileTooLarge");
  }

  if (name === "typeerror" || status === 0) {
    return genericError("transport");
  }

  return fallback;
}

export function toUserFacingError(error: unknown, fallback: string) {
  if (error instanceof UserFacingError) {
    return error;
  }

  return new UserFacingError(getUserFacingErrorMessage(error, fallback), error);
}

function getErrorField(error: unknown, field: string) {
  if (typeof error !== "object" || !error || !(field in error)) {
    return null;
  }

  const value = (error as Record<string, unknown>)[field];
  return value === null || value === undefined ? null : String(value);
}

function getErrorStatus(error: unknown) {
  const rawStatus =
    getErrorField(error, "status") ?? getErrorField(error, "statusCode");
  const status = rawStatus === null ? Number.NaN : Number(rawStatus);

  return Number.isFinite(status) ? status : null;
}
