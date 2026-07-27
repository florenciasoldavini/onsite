export function getMapsFunctionErrorMessage(error: unknown, fallback: string) {
  const response = getFunctionErrorResponse(error);

  if (response?.status === 401 || response?.status === 403) {
    return "Your session has expired or cannot access maps. Sign in and try again.";
  }

  if (response?.status === 429) {
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
