import { handler } from "../auth-send-email/index.ts";

const encoder = new TextEncoder();
const secretBytes = encoder.encode("onzait-auth-hook-test-secret");
const configuredSecret = `v1,whsec_${encodeBase64(secretBytes)}`;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function encodeBase64(value: Uint8Array) {
  return btoa(String.fromCharCode(...value));
}

async function signedRequest(
  payload: Record<string, unknown>,
  id = "delivery-test-1",
) {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1_000).toString();
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${id}.${timestamp}.${body}`),
  );

  return new Request("http://localhost/auth-send-email", {
    body,
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-signature": `v1,${encodeBase64(new Uint8Array(signature))}`,
      "webhook-timestamp": timestamp,
    },
    method: "POST",
  });
}

function hookPayload(action: "recovery" | "signup", language: string) {
  return {
    email_data: {
      email_action_type: action,
      redirect_to: `https://onzait.example/callback?lang=${language}`,
      site_url: "https://project.supabase.co",
      token_hash: "trusted-token-hash",
    },
    user: { email: "recipient@example.com" },
  };
}

Deno.test("auth email hook rejects an invalid signature before parsing", async () => {
  Deno.env.set("SEND_EMAIL_HOOK_SECRET", configuredSecret);
  Deno.env.set("RESEND_API_KEY", "re_test");

  const response = await handler(
    new Request("http://localhost/auth-send-email", {
      body: JSON.stringify(hookPayload("signup", "es")),
      headers: {
        "webhook-id": "invalid",
        "webhook-signature": "v1,invalid",
        "webhook-timestamp": Math.floor(Date.now() / 1_000).toString(),
      },
      method: "POST",
    }),
  );

  assert(response.status === 401, "Invalid signatures must be rejected.");
});

Deno.test("signed auth hook delivery localizes links and forwards idempotency", async () => {
  Deno.env.set("SEND_EMAIL_HOOK_SECRET", configuredSecret);
  Deno.env.set("RESEND_API_KEY", "re_test");
  const originalFetch = globalThis.fetch;
  let providerBody = "";
  let idempotencyKey = "";

  globalThis.fetch = (_input, init) => {
    providerBody = String(init?.body ?? "");
    idempotencyKey = new Headers(init?.headers).get("Idempotency-Key") ?? "";
    return Promise.resolve(new Response("{}", { status: 200 }));
  };

  try {
    const response = await handler(
      await signedRequest(hookPayload("recovery", "en"), "delivery-en-1"),
    );

    assert(response.status === 200, "Signed hook delivery must succeed.");
    assert(
      idempotencyKey === "delivery-en-1",
      "Delivery identifier was not forwarded.",
    );
    assert(
      providerBody.includes("trusted-token-hash"),
      "Trusted token hash is missing.",
    );
    assert(
      providerBody.includes("type=recovery"),
      "Recovery action is missing.",
    );
    assert(
      providerBody.includes('lang=\\"en\\"'),
      "English email was not rendered.",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("auth email hook reports provider failures without leaking details", async () => {
  Deno.env.set("SEND_EMAIL_HOOK_SECRET", configuredSecret);
  Deno.env.set("RESEND_API_KEY", "re_test");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () =>
    Promise.resolve(new Response("private", { status: 500 }));

  try {
    const response = await handler(
      await signedRequest(hookPayload("signup", "es"), "delivery-es-1"),
    );
    const body = await response.text();

    assert(
      response.status === 502,
      "Provider failures must be reported safely.",
    );
    assert(
      !body.includes("private"),
      "Provider details must not reach the hook response.",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("auth email hook bounds provider requests", async () => {
  Deno.env.set("SEND_EMAIL_HOOK_SECRET", configuredSecret);
  Deno.env.set("RESEND_API_KEY", "re_test");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("Request timed out", "AbortError"));
      });
    });

  try {
    const startedAt = Date.now();
    const response = await handler(
      await signedRequest(hookPayload("signup", "es"), "delivery-timeout-1"),
    );
    const elapsed = Date.now() - startedAt;

    assert(response.status === 502, "Timed-out delivery must fail safely.");
    assert(
      elapsed >= 3_500 && elapsed < 5_500,
      "Provider timeout is not bounded to four seconds.",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
