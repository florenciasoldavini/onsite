import { AuthenticationError, requireAuthenticatedUser } from "./auth.ts";
import { corsHeaders, getIpAddress, jsonResponse } from "./cors.ts";

type AuthenticatedUser = {
  id: string;
};

type RateLimiter = {
  consume: (key: string) => boolean;
};

type Authenticate = (
  request: Request,
  message: string,
) => Promise<AuthenticatedUser>;

type AuthenticatedJsonContext = {
  body: unknown;
  request: Request;
  user: AuthenticatedUser;
};

type AuthenticatedJsonHandlerOptions = {
  authenticate?: Authenticate;
  authenticationErrorMessage: string;
  fallbackErrorMessage: string;
  logLabel: string;
  rateLimitErrorMessage: string;
  rateLimiter: RateLimiter;
};

export function createAuthenticatedJsonHandler(
  options: AuthenticatedJsonHandlerOptions,
  handler: (
    context: AuthenticatedJsonContext,
  ) => Promise<Response> | Response,
) {
  const authenticate = options.authenticate ?? requireAuthenticatedUser;

  return async (request: Request) => {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, { status: 405 });
    }

    try {
      const user = await authenticate(
        request,
        options.authenticationErrorMessage,
      );
      const rateKey = `${user.id}:${getIpAddress(request)}`;

      if (!options.rateLimiter.consume(rateKey)) {
        return jsonResponse(
          { error: options.rateLimitErrorMessage },
          { status: 429 },
        );
      }

      const body: unknown = await request.json().catch(() => null);

      return await handler({ body, request, user });
    } catch (error) {
      const isAuthenticationError = error instanceof AuthenticationError;
      const message = isAuthenticationError
        ? error.message
        : options.fallbackErrorMessage;
      const status = isAuthenticationError ? 401 : 500;

      if (!isAuthenticationError) {
        console.error(`${options.logLabel} failed`, error);
      }

      return jsonResponse({ error: message }, { status });
    }
  };
}
