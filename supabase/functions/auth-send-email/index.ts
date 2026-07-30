import { Webhook } from "standardwebhooks";
import { buildAuthEmail } from "../_shared/email/auth-email.tsx";
import { resolveEmailLanguage } from "../_shared/email/localization.ts";

type HookPayload = {
  user: { email: string };
  email_data: {
    email_action_type: string;
    redirect_to: string;
    site_url: string;
    token_hash: string;
  };
};

const providerTimeoutMs = 4_000;

export async function handler(request: Request) {
  if (request.method !== "POST") {
    return hookError("METHOD_NOT_ALLOWED", 405);
  }

  const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM") ??
    "Onzait <onboarding@resend.dev>";
  const emailReplyTo = Deno.env.get("EMAIL_REPLY_TO");

  if (!hookSecret || !resendApiKey) {
    console.error("Auth email hook configuration is incomplete.");
    return hookError("HOOK_UNAVAILABLE", 503);
  }

  const rawPayload = await request.text();
  let payload: HookPayload;

  try {
    const webhook = new Webhook(
      hookSecret.replace(/^v1,whsec_/, ""),
    );
    payload = webhook.verify(
      rawPayload,
      Object.fromEntries(request.headers),
    ) as HookPayload;
  } catch (error) {
    console.error("Auth email hook signature verification failed.", error);
    return hookError("INVALID_SIGNATURE", 401);
  }

  const parsed = parseHookPayload(payload);
  if (!parsed) {
    return hookError("UNSUPPORTED_EMAIL_ACTION", 400);
  }

  const language = resolveEmailLanguage(
    getRedirectLanguage(parsed.redirectTo),
  );
  const actionUrl = buildVerificationUrl(parsed);
  const email = await buildAuthEmail({
    action: parsed.action,
    actionUrl,
    language,
  });
  const deliveryId = request.headers.get("webhook-id") ??
    request.headers.get("svix-id") ??
    undefined;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from: emailFrom,
        html: email.html,
        subject: email.subject,
        to: parsed.recipient,
        ...(emailReplyTo ? { reply_to: emailReplyTo } : {}),
      }),
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        ...(deliveryId ? { "Idempotency-Key": deliveryId } : {}),
      },
      method: "POST",
      signal: AbortSignal.timeout(providerTimeoutMs),
    });

    if (!response.ok) {
      console.error("Auth email provider request failed.", {
        action: parsed.action,
        status: response.status,
      });
      return hookError("DELIVERY_FAILED", 502);
    }
  } catch (error) {
    console.error("Auth email provider request failed.", {
      action: parsed.action,
      error,
    });
    return hookError("DELIVERY_FAILED", 502);
  }

  return new Response("{}", {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function parseHookPayload(payload: HookPayload) {
  if (
    !payload ||
    typeof payload.user?.email !== "string" ||
    typeof payload.email_data?.token_hash !== "string" ||
    typeof payload.email_data?.redirect_to !== "string" ||
    typeof payload.email_data?.site_url !== "string"
  ) {
    return null;
  }

  const action = payload.email_data.email_action_type;
  if (action !== "signup" && action !== "recovery") {
    return null;
  }

  return {
    action,
    redirectTo: payload.email_data.redirect_to,
    recipient: payload.user.email,
    siteUrl: payload.email_data.site_url,
    tokenHash: payload.email_data.token_hash,
  } as const;
}

function buildVerificationUrl(input: {
  action: "recovery" | "signup";
  redirectTo: string;
  siteUrl: string;
  tokenHash: string;
}) {
  const url = new URL("/auth/v1/verify", input.siteUrl);
  url.searchParams.set("token", input.tokenHash);
  url.searchParams.set("type", input.action);
  url.searchParams.set("redirect_to", input.redirectTo);
  return url.toString();
}

function getRedirectLanguage(redirectTo: string) {
  try {
    return new URL(redirectTo).searchParams.get("lang");
  } catch {
    return null;
  }
}

function hookError(code: string, status: number) {
  return new Response(
    JSON.stringify({ error: { http_code: status, message: code } }),
    {
      headers: { "Content-Type": "application/json" },
      status,
    },
  );
}

export default { fetch: handler };
