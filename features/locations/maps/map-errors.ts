export type LocationErrorCode =
  | "addressResolve"
  | "addressSuggestions"
  | "mapPreview"
  | "rateLimited"
  | "session";

export class LocationRepositoryError extends Error {
  readonly cause: unknown;
  readonly localizationCode: LocationErrorCode;

  constructor(localizationCode: LocationErrorCode, cause: unknown) {
    super(`Location request failed: ${localizationCode}`);
    this.name = "LocationRepositoryError";
    this.cause = cause;
    this.localizationCode = localizationCode;
  }
}

export function getMapsFunctionErrorCode(
  error: unknown,
  fallback: LocationErrorCode
): LocationErrorCode {
  const response = getFunctionErrorResponse(error);

  if (response?.status === 401 || response?.status === 403) {
    return "session";
  }

  if (response?.status === 429) {
    return "rateLimited";
  }

  return fallback;
}

export function getMapsFunctionErrorMessage(error: unknown, fallback: string) {
  const code = getMapsFunctionErrorCode(error, "mapPreview");
  if (code === "session") {
    return "Your session has expired or cannot access maps. Sign in and try again.";
  }

  if (code === "rateLimited") {
    return "Too many map requests were made. Wait a moment and try again.";
  }

  return fallback;
}

function getFunctionErrorResponse(error: unknown) {
  if (
    typeof error === "object" &&
    error &&
    "context" in error &&
    (error as { context?: unknown }).context instanceof Response
  ) {
    return (error as { context: Response }).context;
  }

  return null;
}
