import { createAuthenticatedJsonHandler } from "../_shared/authenticated-json-handler.ts";
import { jsonResponse } from "../_shared/cors.ts";
import { consumeGoogleMapsMonthlyLimit } from "../_shared/google-maps-usage-limit.ts";
import { createRateLimiter } from "../_shared/rate-limit.ts";
import { parseMapPoints, parseMapViewport } from "./input.ts";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 40;
const STATIC_MAP_WIDTH = 720;
const STATIC_MAP_HEIGHT = 520;
const rateLimiter = createRateLimiter({
  maxRequests: RATE_LIMIT_MAX,
  windowMs: RATE_LIMIT_WINDOW_MS,
});

Deno.serve(
  createAuthenticatedJsonHandler(
    {
      authenticationErrorMessage:
        "You must be authenticated to load map previews.",
      fallbackErrorMessage: "Map preview is unavailable right now.",
      logLabel: "maps-static-preview",
      rateLimitErrorMessage: "Too many map previews. Try again shortly.",
      rateLimiter,
    },
    async ({ body }) => {
      const points = parseMapPoints(body);
      const viewport = parseMapViewport(body);

      if (points.length === 0 && !viewport) {
        return jsonResponse(
          { error: "Select a valid map location." },
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

      const usageLimit = await consumeGoogleMapsMonthlyLimit({
        defaultLimit: 100,
        envName: "GOOGLE_MAPS_STATIC_MONTHLY_LIMIT",
        service: "maps_static_preview",
      });

      if (!usageLimit.allowed) {
        return jsonResponse(
          { error: usageLimit.message },
          { status: usageLimit.status },
        );
      }

      const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
      url.searchParams.set("size", `${STATIC_MAP_WIDTH}x${STATIC_MAP_HEIGHT}`);
      url.searchParams.set("scale", "2");
      url.searchParams.set("maptype", "roadmap");
      url.searchParams.append("style", "feature:poi|visibility:off");
      url.searchParams.append("style", "feature:transit|visibility:off");

      if (viewport) {
        url.searchParams.set(
          "center",
          `${viewport.centerLatitude},${viewport.centerLongitude}`,
        );
        url.searchParams.set("zoom", String(viewport.zoom));
      } else if (points.length === 1) {
        const [point] = points;

        url.searchParams.set("center", `${point.latitude},${point.longitude}`);
        url.searchParams.set("zoom", "15");
      } else {
        for (const point of points) {
          url.searchParams.append(
            "visible",
            `${point.latitude},${point.longitude}`,
          );
        }
      }

      url.searchParams.set("key", apiKey);

      const googleResponse = await fetch(url);

      if (!googleResponse.ok) {
        if (googleResponse.status === 403) {
          return jsonResponse(
            {
              error:
                "Maps Static API is not enabled or allowed for this Google Maps key.",
            },
            { status: 502 },
          );
        }

        if (googleResponse.status === 429) {
          return jsonResponse(
            {
              error: "Google Maps preview quota was reached. Try again later.",
            },
            { status: 429 },
          );
        }

        return jsonResponse(
          { error: "Map preview is unavailable right now." },
          { status: 502 },
        );
      }

      const contentType = googleResponse.headers.get("content-type") ??
        "image/png";

      if (!contentType.startsWith("image/")) {
        return jsonResponse(
          { error: "Map preview returned an invalid image." },
          { status: 502 },
        );
      }

      const bytes = new Uint8Array(await googleResponse.arrayBuffer());
      const imageDataUrl = `data:${contentType};base64,${toBase64(bytes)}`;

      return jsonResponse({
        attribution: "Google Maps",
        imageDataUrl,
      });
    },
  ),
);

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}
