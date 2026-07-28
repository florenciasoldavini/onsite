import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "../_shared/auth.ts";
import { createAuthenticatedJsonHandler } from "../_shared/authenticated-json-handler.ts";
import { jsonResponse } from "../_shared/cors.ts";
import { createRateLimiter } from "../_shared/rate-limit.ts";
import { getTrimmedString } from "../_shared/request.ts";
import { createTtlCache } from "../_shared/ttl-cache.ts";
import {
  parseMapPoints,
  parseMapViewport,
} from "../maps-static-preview/input.ts";
import { parseSuggestions } from "../places-autocomplete/payload.ts";
import { parseResolvedPlace } from "../places-resolve/payload.ts";

function assertEquals(actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, received ${actualJson}.`);
  }
}

Deno.test("request strings are narrowed and trimmed", () => {
  assertEquals(
    getTrimmedString({ input: "  Main Street  " }, "input"),
    "Main Street",
  );
  assertEquals(getTrimmedString({ input: 42 }, "input"), "");
  assertEquals(getTrimmedString(null, "input"), "");
});

Deno.test(
  "authenticated handlers reject requests without a bearer token",
  async () => {
    try {
      await requireAuthenticatedUser(
        new Request("https://example.com"),
        "Authentication required.",
      );
      throw new Error("Expected authentication to fail.");
    } catch (error) {
      assertEquals(error instanceof AuthenticationError, true);
      assertEquals(
        error instanceof Error ? error.message : null,
        "Authentication required.",
      );
    }
  },
);

Deno.test("authenticated JSON handler owns the shared request boundary", async () => {
  const consumedKeys: string[] = [];
  const handler = createAuthenticatedJsonHandler(
    {
      authenticate: () => Promise.resolve({ id: "user-1" }),
      authenticationErrorMessage: "Authentication required.",
      fallbackErrorMessage: "Request failed.",
      logLabel: "test-handler",
      rateLimitErrorMessage: "Slow down.",
      rateLimiter: {
        consume: (key) => {
          consumedKeys.push(key);
          return true;
        },
      },
    },
    ({ body, user }) =>
      jsonResponse({
        body,
        userId: user.id,
      }),
  );

  const preflightResponse = await handler(
    new Request("https://example.com", { method: "OPTIONS" }),
  );
  assertEquals(preflightResponse.status, 204);
  assertEquals(
    preflightResponse.headers.get("Access-Control-Allow-Methods"),
    "POST, OPTIONS",
  );

  const methodResponse = await handler(
    new Request("https://example.com", { method: "GET" }),
  );
  assertEquals(methodResponse.status, 405);
  assertEquals(await methodResponse.json(), { error: "Method not allowed." });

  const successResponse = await handler(
    new Request("https://example.com", {
      body: JSON.stringify({ input: "Main Street" }),
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
      },
      method: "POST",
    }),
  );
  assertEquals(successResponse.status, 200);
  assertEquals(await successResponse.json(), {
    body: { input: "Main Street" },
    userId: "user-1",
  });
  assertEquals(consumedKeys, ["user-1:203.0.113.10"]);
});

Deno.test("authenticated JSON handler maps shared errors", async () => {
  const unauthorizedHandler = createAuthenticatedJsonHandler(
    {
      authenticate: () =>
        Promise.reject(new AuthenticationError("Authentication required.")),
      authenticationErrorMessage: "Authentication required.",
      fallbackErrorMessage: "Request failed.",
      logLabel: "test-handler",
      rateLimitErrorMessage: "Slow down.",
      rateLimiter: { consume: () => true },
    },
    () => jsonResponse({ ok: true }),
  );
  const unauthorizedResponse = await unauthorizedHandler(
    new Request("https://example.com", { method: "POST" }),
  );
  assertEquals(unauthorizedResponse.status, 401);
  assertEquals(await unauthorizedResponse.json(), {
    error: "Authentication required.",
  });

  const limitedHandler = createAuthenticatedJsonHandler(
    {
      authenticate: () => Promise.resolve({ id: "user-1" }),
      authenticationErrorMessage: "Authentication required.",
      fallbackErrorMessage: "Request failed.",
      logLabel: "test-handler",
      rateLimitErrorMessage: "Slow down.",
      rateLimiter: { consume: () => false },
    },
    () => jsonResponse({ ok: true }),
  );
  const limitedResponse = await limitedHandler(
    new Request("https://example.com", { method: "POST" }),
  );
  assertEquals(limitedResponse.status, 429);
  assertEquals(await limitedResponse.json(), { error: "Slow down." });

  const loggedValues: unknown[][] = [];
  const originalConsoleError = console.error;
  const failureHandler = createAuthenticatedJsonHandler(
    {
      authenticate: () => Promise.resolve({ id: "user-1" }),
      authenticationErrorMessage: "Authentication required.",
      fallbackErrorMessage: "Request failed.",
      logLabel: "test-handler",
      rateLimitErrorMessage: "Slow down.",
      rateLimiter: { consume: () => true },
    },
    () => {
      throw new Error("provider details");
    },
  );
  console.error = (...values: unknown[]) => {
    loggedValues.push(values);
  };

  try {
    const failureResponse = await failureHandler(
      new Request("https://example.com", { method: "POST" }),
    );
    assertEquals(failureResponse.status, 500);
    assertEquals(await failureResponse.json(), { error: "Request failed." });
  } finally {
    console.error = originalConsoleError;
  }

  assertEquals(loggedValues[0]?.[0], "test-handler failed");
});

Deno.test("rate limiter blocks until its window resets", () => {
  let now = 1_000;
  const limiter = createRateLimiter({
    maxRequests: 2,
    now: () => now,
    windowMs: 60_000,
  });

  assertEquals(limiter.consume("user:ip"), true);
  assertEquals(limiter.consume("user:ip"), true);
  assertEquals(limiter.consume("user:ip"), false);

  now += 60_000;
  assertEquals(limiter.consume("user:ip"), true);
});

Deno.test("TTL cache expires stored responses", () => {
  let now = 1_000;
  const cache = createTtlCache<string>(() => now);

  cache.set("result", "cached", 500);
  assertEquals(cache.get("result"), "cached");

  now += 500;
  assertEquals(cache.get("result"), null);
});

Deno.test("static map input accepts valid points and clamps zoom", () => {
  assertEquals(
    parseMapPoints({
      points: [
        { latitude: -34.6037, longitude: -58.3816 },
        { latitude: 200, longitude: 10 },
        null,
      ],
    }),
    [{ latitude: -34.6037, longitude: -58.3816 }],
  );
  assertEquals(
    parseMapViewport({
      centerLatitude: -34.6037,
      centerLongitude: -58.3816,
      zoom: 99,
    }),
    {
      centerLatitude: -34.6037,
      centerLongitude: -58.3816,
      zoom: 18,
    },
  );
  assertEquals(parseMapViewport({ latitude: 100, longitude: 10 }), null);
});

Deno.test("autocomplete payload discards malformed predictions", () => {
  assertEquals(
    parseSuggestions({
      suggestions: [
        {
          placePrediction: {
            placeId: "place-1",
            text: { text: "Main Street" },
          },
        },
        { placePrediction: { placeId: "missing-text" } },
        null,
      ],
    }),
    [{ placeId: "place-1", text: "Main Street" }],
  );
});

Deno.test("place details require a typed address and coordinates", () => {
  assertEquals(
    parseResolvedPlace(
      {
        formattedAddress: "Main Street",
        id: "google-place-id",
        location: { latitude: -34.6037, longitude: -58.3816 },
      },
      "fallback-id",
    ),
    {
      address: "Main Street",
      attribution: "Google Maps",
      latitude: -34.6037,
      longitude: -58.3816,
      placeId: "google-place-id",
    },
  );
  assertEquals(
    parseResolvedPlace(
      { formattedAddress: "Main Street", location: { latitude: "invalid" } },
      "fallback-id",
    ),
    null,
  );
});
