import { createClient, type User } from "@supabase/supabase-js";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { buildWelcomeToOnzaitEmail } from "../_shared/email/welcome-to-onzait.tsx";
import { resolveEmailLanguage } from "../_shared/email/localization.ts";
import { welcomeEmailFailureResponse } from "./errors.ts";

type WelcomeRequestBody = {
  language?: unknown;
  name?: string;
};

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const emailFrom = Deno.env.get("EMAIL_FROM") ??
  "Onzait <onboarding@resend.dev>";
const emailReplyTo = Deno.env.get("EMAIL_REPLY_TO");
const appUrl = Deno.env.get("SITE_URL") ??
  Deno.env.get("EXPO_PUBLIC_SITE_URL") ??
  "https://onzait.vercel.app";
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

type UserEmailState = {
  email: string;
  first_name: string;
  welcome_email_sent_at: string | null;
};

function getFirstNameFromEmail(email: string) {
  return email.split("@")[0]?.split(/[._-]/)[0] || "there";
}

function getFirstName(user: User, body: WelcomeRequestBody) {
  return (
    body.name?.trim() ||
    user.user_metadata?.first_name?.trim() ||
    user.user_metadata?.full_name?.trim().split(/\s+/)[0] ||
    user.user_metadata?.name?.trim().split(/\s+/)[0] ||
    (user.email ? getFirstNameFromEmail(user.email) : "there")
  );
}

function createAdminSupabaseClient(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, { status: 405 });
  }

  if (!resendApiKey) {
    console.error("Welcome email configuration is incomplete.", {
      missing: ["RESEND_API_KEY"],
    });
    return welcomeEmailFailureResponse("configuration");
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Welcome email configuration is incomplete.", {
      missing: [
        ...(!supabaseUrl ? ["SUPABASE_URL"] : []),
        ...(!serviceRoleKey ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
      ],
    });
    return welcomeEmailFailureResponse("configuration");
  }

  let authUser: User;

  try {
    authUser = await requireAuthenticatedUser(
      req,
      "A signed-in user with an email address is required.",
    );
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof AuthenticationError
          ? error.message
          : "Could not validate the signed-in user.",
      },
      { status: error instanceof AuthenticationError ? 401 : 500 },
    );
  }

  const adminSupabase = createAdminSupabaseClient(
    supabaseUrl,
    serviceRoleKey,
  );

  if (!authUser.email) {
    return jsonResponse(
      { error: "A signed-in user with an email address is required." },
      { status: 401 },
    );
  }

  let body: WelcomeRequestBody = {};

  try {
    body = (await req.json()) as WelcomeRequestBody;
  } catch {
    body = {};
  }

  const language = resolveEmailLanguage(body.language);
  const sentAt = new Date().toISOString();
  const { data: claimedUser, error: claimError } = await adminSupabase
    .from("users")
    .update({ welcome_email_sent_at: sentAt })
    .eq("id", authUser.id)
    .is("welcome_email_sent_at", null)
    .select("email, first_name, welcome_email_sent_at")
    .maybeSingle();

  const claimedEmailState = claimedUser as UserEmailState | null;

  if (claimError) {
    console.error("Could not claim welcome email delivery.", claimError);
    return welcomeEmailFailureResponse("state-unavailable");
  }

  if (!claimedEmailState) {
    const { data: existingUser, error: existingUserError } = await adminSupabase
      .from("users")
      .select("email, first_name, welcome_email_sent_at")
      .eq("id", authUser.id)
      .maybeSingle();

    const existingEmailState = existingUser as UserEmailState | null;

    if (existingUserError) {
      console.error(
        "Could not read the existing welcome email state.",
        existingUserError,
      );
      return welcomeEmailFailureResponse("state-unavailable");
    }

    if (!existingEmailState) {
      return welcomeEmailFailureResponse("profile-missing");
    }

    if (existingEmailState.welcome_email_sent_at) {
      return jsonResponse({
        ok: true,
        skipped: true,
        welcome_email_sent_at: existingEmailState.welcome_email_sent_at,
      });
    }

    return welcomeEmailFailureResponse("state-conflict");
  }

  const name = body.name?.trim() ||
    claimedEmailState.first_name ||
    getFirstName(authUser, body);

  try {
    const email = await buildWelcomeToOnzaitEmail({
      appUrl,
      language,
      name,
    });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `welcome-to-onzait-${authUser.id}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: claimedEmailState.email,
        subject: email.subject,
        html: email.html,
        ...(emailReplyTo ? { reply_to: emailReplyTo } : {}),
      }),
    });

    const result: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Welcome email provider request failed.", {
        providerResponse: result,
        status: response.status,
      });
      await releaseWelcomeEmailClaim({
        adminSupabase,
        sentAt,
        userId: authUser.id,
      });
      return welcomeEmailFailureResponse("delivery");
    }

    return jsonResponse({
      id: getEmailId(result),
      ok: true,
      skipped: false,
      welcome_email_sent_at: sentAt,
    });
  } catch (error) {
    console.error("Welcome email delivery failed unexpectedly.", error);
    await releaseWelcomeEmailClaim({
      adminSupabase,
      sentAt,
      userId: authUser.id,
    });
    return welcomeEmailFailureResponse("delivery");
  }
}

function getEmailId(result: unknown) {
  if (
    typeof result === "object" &&
    result !== null &&
    "id" in result &&
    typeof result.id === "string"
  ) {
    return result.id;
  }

  return undefined;
}

async function releaseWelcomeEmailClaim({
  adminSupabase,
  sentAt,
  userId,
}: {
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>;
  sentAt: string;
  userId: string;
}) {
  const { error } = await adminSupabase
    .from("users")
    .update({ welcome_email_sent_at: null })
    .eq("id", userId)
    .eq("welcome_email_sent_at", sentAt);

  if (error) {
    console.error("Could not release the welcome email delivery claim.", error);
  }
}

export default { fetch: handler };
