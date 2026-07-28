import { createAuthenticatedJsonHandler } from "../_shared/authenticated-json-handler.ts";
import { jsonResponse } from "../_shared/cors.ts";
import { consumeGoogleMapsMonthlyLimit } from "../_shared/google-maps-usage-limit.ts";
import { createRateLimiter } from "../_shared/rate-limit.ts";
import { getTrimmedString } from "../_shared/request.ts";
import { createTtlCache } from "../_shared/ttl-cache.ts";
import { parseResolvedPlace, type ResolvedPlace } from "./payload.ts";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const CACHE_TTL_MS = 5 * 60_000;
const cache = createTtlCache<ResolvedPlace>();
const rateLimiter = createRateLimiter({
  maxRequests: RATE_LIMIT_MAX,
  windowMs: RATE_LIMIT_WINDOW_MS,
});

Deno.serve(
  createAuthenticatedJsonHandler(
    {
      authenticationErrorMessage:
        "You must be authenticated to resolve addresses.",
      fallbackErrorMessage: "Address details are unavailable right now.",
      logLabel: "places-resolve",
      rateLimitErrorMessage: "Too many address resolutions. Try again shortly.",
      rateLimiter,
    },
    async ({ body }) => {
      const placeId = getTrimmedString(body, "placeId");
      const sessionToken = getTrimmedString(body, "sessionToken");

      if (placeId.length < 3 || placeId.length > 255) {
        return jsonResponse(
          { error: "Select a valid Google Maps address result." },
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

      const cached = cache.get(placeId);

      if (cached) {
        return jsonResponse(cached);
      }

      const usageLimit = await consumeGoogleMapsMonthlyLimit({
        defaultLimit: 100,
        envName: "GOOGLE_MAPS_PLACE_DETAILS_MONTHLY_LIMIT",
        service: "places_resolve",
      });

      if (!usageLimit.allowed) {
        return jsonResponse(
          { error: usageLimit.message },
          { status: usageLimit.status },
        );
      }

      const url = new URL(
        `https://places.googleapis.com/v1/places/${
          encodeURIComponent(placeId)
        }`,
      );
      url.searchParams.set("sessionToken", sessionToken);

      const googleResponse = await fetch(url, {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "id,formattedAddress,location",
        },
      });

      if (!googleResponse.ok) {
        return jsonResponse(
          { error: "Address details are unavailable right now." },
          { status: 502 },
        );
      }

      const place: unknown = await googleResponse.json();
      const resolvedPlace = parseResolvedPlace(place, placeId);

      if (!resolvedPlace) {
        return jsonResponse(
          { error: "Selected address is missing coordinates." },
          { status: 422 },
        );
      }

      cache.set(placeId, resolvedPlace, CACHE_TTL_MS);
      return jsonResponse(resolvedPlace);
    },
  ),
);
