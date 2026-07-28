import { createAuthenticatedJsonHandler } from "../_shared/authenticated-json-handler.ts";
import { jsonResponse } from "../_shared/cors.ts";
import { consumeGoogleMapsMonthlyLimit } from "../_shared/google-maps-usage-limit.ts";
import { createRateLimiter } from "../_shared/rate-limit.ts";
import { getTrimmedString } from "../_shared/request.ts";
import { createTtlCache } from "../_shared/ttl-cache.ts";
import { type AutocompleteSuggestion, parseSuggestions } from "./payload.ts";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 40;
const CACHE_TTL_MS = 30_000;
const cache = createTtlCache<AutocompleteResponse>();
const rateLimiter = createRateLimiter({
  maxRequests: RATE_LIMIT_MAX,
  windowMs: RATE_LIMIT_WINDOW_MS,
});

type AutocompleteResponse = {
  attribution: "Google Maps";
  suggestions: AutocompleteSuggestion[];
};

Deno.serve(
  createAuthenticatedJsonHandler(
    {
      authenticationErrorMessage:
        "You must be authenticated to search addresses.",
      fallbackErrorMessage: "Address search is unavailable right now.",
      logLabel: "places-autocomplete",
      rateLimitErrorMessage: "Too many address lookups. Try again shortly.",
      rateLimiter,
    },
    async ({ body }) => {
      const input = getTrimmedString(body, "input");
      const sessionToken = getTrimmedString(body, "sessionToken");

      if (input.length < 3 || input.length > 160) {
        return jsonResponse(
          { error: "Enter at least 3 characters for address search." },
          { status: 400 },
        );
      }

      if (sessionToken.length < 8 || sessionToken.length > 128) {
        return jsonResponse(
          { error: "Missing address search session token." },
          { status: 400 },
        );
      }

      const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

      if (!apiKey) {
        return jsonResponse(
          { error: "Google Maps is not configured." },
          { status: 500 },
        );
      }

      const cacheKey = `${input.toLowerCase()}:${sessionToken}`;
      const cached = cache.get(cacheKey);

      if (cached) {
        return jsonResponse(cached);
      }

      const usageLimit = await consumeGoogleMapsMonthlyLimit({
        defaultLimit: 500,
        envName: "GOOGLE_MAPS_AUTOCOMPLETE_MONTHLY_LIMIT",
        service: "places_autocomplete",
      });

      if (!usageLimit.allowed) {
        return jsonResponse(
          { error: usageLimit.message },
          { status: usageLimit.status },
        );
      }

      const googleResponse = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          body: JSON.stringify({
            input,
            sessionToken,
          }),
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
          },
          method: "POST",
        },
      );

      if (!googleResponse.ok) {
        return jsonResponse(
          { error: "Address search is unavailable right now." },
          { status: 502 },
        );
      }

      const googlePayload: unknown = await googleResponse.json();
      const value: AutocompleteResponse = {
        attribution: "Google Maps",
        suggestions: parseSuggestions(googlePayload),
      };

      cache.set(cacheKey, value, CACHE_TTL_MS);
      return jsonResponse(value);
    },
  ),
);
