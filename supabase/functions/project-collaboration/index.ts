import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { buildProjectInvitationEmail } from "../_shared/email/project-invitation.tsx";
import {
  createEmailTranslator,
  resolveEmailLanguage,
} from "../_shared/email/localization.ts";

type JsonRecord = Record<string, unknown>;

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const emailFrom = Deno.env.get("EMAIL_FROM") ??
  "Onzait <onboarding@resend.dev>";
const emailReplyTo = Deno.env.get("EMAIL_REPLY_TO");
const appUrl = (
  Deno.env.get("SITE_URL") ??
    Deno.env.get("EXPO_PUBLIC_SITE_URL") ??
    "https://onzait.vercel.app"
).replace(/\/+$/, "");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

async function handler(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (request.method !== "POST") {
    return failure("METHOD_NOT_ALLOWED", "Method not allowed.", 405);
  }

  const body = await request.json().catch(() => null);

  if (!isRecord(body) || typeof body.action !== "string") {
    return failure(
      "COLLABORATION_INVALID_REQUEST",
      "The collaboration request is invalid.",
      400,
    );
  }

  if (body.action === "preview") {
    try {
      return await previewInvitation(body);
    } catch (error) {
      return failure(
        "INVITATION_PREVIEW_INVALID",
        error instanceof PublicInputError
          ? error.message
          : "We couldn't load this invitation. Try again.",
        error instanceof PublicInputError ? 400 : 500,
      );
    }
  }

  let user: User;

  try {
    user = await requireAuthenticatedUser(
      request,
      "Sign in to manage project collaboration.",
    );
  } catch (error) {
    return failure(
      "COLLABORATION_UNAUTHORIZED",
      error instanceof AuthenticationError
        ? error.message
        : "We couldn't validate your account.",
      error instanceof AuthenticationError ? 401 : 500,
    );
  }

  const client = createUserClient(request);

  if (!client) {
    return configurationFailure();
  }

  try {
    switch (body.action) {
      case "list-members":
        return rpcResult(
          await client.rpc("list_project_members", {
            p_limit: requirePageSize(body.pageSize),
            p_offset: requirePage(body.page) * requirePageSize(body.pageSize),
            p_project_id: requireUuid(body.projectId),
          }),
        );
      case "list-invitations":
        return rpcResult(
          await client.rpc("list_my_project_invitations", {
            p_limit: requirePageSize(body.pageSize),
            p_offset: requirePage(body.page) * requirePageSize(body.pageSize),
          }),
        );
      case "invite":
        return createInvitation({ body, client, user });
      case "resend":
        return resendInvitation({ body, client, user });
      case "accept":
      case "decline":
        requireVerifiedEmail(user);
        return rpcResult(
          await client.rpc("respond_project_invitation", {
            p_invitation_id: requireUuid(body.invitationId),
            p_response: body.action === "accept" ? "accepted" : "declined",
          }),
        );
      case "revoke":
        return rpcResult(
          await client.rpc("revoke_project_invitation", {
            p_invitation_id: requireUuid(body.invitationId),
          }),
        );
      case "update-role":
        return rpcResult(
          await client.rpc("update_project_member_role", {
            p_membership_id: requireUuid(body.membershipId),
            p_role_code: requireRoleCode(body.roleCode),
          }),
        );
      case "remove-member":
        return rpcResult(
          await client.rpc("remove_project_member", {
            p_membership_id: requireUuid(body.membershipId),
          }),
        );
      case "leave":
        return rpcResult(
          await client.rpc("leave_project", {
            p_project_id: requireUuid(body.projectId),
          }),
        );
      default:
        return failure(
          "COLLABORATION_INVALID_ACTION",
          "That collaboration action is unavailable.",
          400,
        );
    }
  } catch (error) {
    console.error("Project collaboration action failed.", {
      action: body.action,
      error,
      userId: user.id,
    });
    return failure(
      "COLLABORATION_REQUEST_FAILED",
      error instanceof PublicInputError
        ? error.message
        : "We couldn't complete that collaboration action. Try again.",
      error instanceof PublicInputError ? 400 : 500,
    );
  }
}

async function previewInvitation(body: JsonRecord) {
  const token = requireToken(body.token);
  const admin = createAdminClient();

  if (!admin) {
    return configurationFailure();
  }

  const tokenHash = await sha256(token);
  const { data: invitation, error } = await admin
    .from("project_invitations")
    .select("id, project_id, role_code, status, expires_at, invited_by")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    console.error("Invitation preview lookup failed.", error);
    return failure(
      "INVITATION_PREVIEW_UNAVAILABLE",
      "We couldn't load this invitation. Try again.",
      500,
    );
  }

  if (!invitation) {
    return failure(
      "INVITATION_NOT_FOUND",
      "This invitation is invalid or no longer available.",
      404,
    );
  }

  const [
    { data: project, error: projectError },
    { data: inviter, error: inviterError },
    { data: role, error: roleError },
  ] = await Promise.all([
    admin
      .from("projects")
      .select("name, deleted_at")
      .eq("id", invitation.project_id)
      .maybeSingle(),
    admin
      .from("users")
      .select("first_name, last_name")
      .eq("id", invitation.invited_by)
      .maybeSingle(),
    admin
      .from("project_roles")
      .select("display_name")
      .eq("code", invitation.role_code)
      .maybeSingle(),
  ]);
  if (projectError || inviterError || roleError) {
    console.error("Invitation preview metadata lookup failed.", {
      inviterError,
      projectError,
      roleError,
    });
    return failure(
      "INVITATION_PREVIEW_UNAVAILABLE",
      "We couldn't load this invitation. Try again.",
      500,
    );
  }
  const expired = new Date(invitation.expires_at).getTime() <= Date.now();

  return jsonResponse({
    data: {
      expiresAt: invitation.expires_at,
      id: invitation.id,
      inviterName: displayName(inviter),
      projectName: project?.name ?? "Project",
      roleCode: invitation.role_code,
      roleName: role?.display_name ?? invitation.role_code,
      status: !project || project.deleted_at
        ? "revoked"
        : expired && invitation.status === "pending"
        ? "expired"
        : invitation.status,
    },
    ok: true,
  });
}

async function createInvitation({
  body,
  client,
  user,
}: {
  body: JsonRecord;
  client: SupabaseClient;
  user: User;
}) {
  const projectId = requireUuid(body.projectId);
  const email = requireEmail(body.email);
  const roleCode = requireRoleCode(body.roleCode);
  const language = resolveEmailLanguage(body.language);
  const token = createToken();
  const expiresAt = sevenDaysFromNow();
  const { data, error } = await client.rpc("create_project_invitation", {
    p_email: email,
    p_expires_at: expiresAt,
    p_language_code: language,
    p_project_id: projectId,
    p_role_code: roleCode,
    p_token_hash: await sha256(token),
  });

  if (error || !isRecord(data)) {
    return rpcError(error);
  }

  return deliverInvitation({ client, invitation: data, token, user });
}

async function resendInvitation({
  body,
  client,
  user,
}: {
  body: JsonRecord;
  client: SupabaseClient;
  user: User;
}) {
  const token = createToken();
  const { data, error } = await client.rpc("resend_project_invitation", {
    p_expires_at: sevenDaysFromNow(),
    p_invitation_id: requireUuid(body.invitationId),
    p_token_hash: await sha256(token),
  });

  if (error || !isRecord(data)) {
    return rpcError(error);
  }

  return deliverInvitation({ client, invitation: data, token, user });
}

async function deliverInvitation({
  client,
  invitation,
  token,
  user,
}: {
  client: SupabaseClient;
  invitation: JsonRecord;
  token: string;
  user: User;
}) {
  if (!resendApiKey) {
    await markDelivery(client, invitation, "failed");
    return configurationFailure();
  }

  const projectId = requireUuid(invitation.project_id);
  const roleCode = requireRoleCode(invitation.role_code);
  const { data: project } = await client
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();
  const acceptUrl = `${appUrl}/invitations/accept#token=${
    encodeURIComponent(
      token,
    )
  }`;
  const invitationId = requireUuid(invitation.id);
  const deliveryVersion = requirePositiveInteger(invitation.delivery_version);
  const language = resolveEmailLanguage(invitation.language_code);

  try {
    const { t } = await createEmailTranslator(language);
    const projectName = typeof project?.name === "string"
      ? project.name
      : t("invitation.fallbackProject");
    const inviterName = displayName(user.user_metadata) ||
      user.email?.split("@")[0] ||
      t("invitation.fallbackInviter");
    const email = await buildProjectInvitationEmail({
      acceptUrl,
      expiresAt: String(invitation.expires_at),
      inviterName,
      language,
      projectName,
      roleCode,
    });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key":
          `project-invitation-${invitationId}-${deliveryVersion}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: requireEmail(invitation.invited_email),
        subject: email.subject,
        html: email.html,
        ...(emailReplyTo ? { reply_to: emailReplyTo } : {}),
      }),
    });

    if (!response.ok) {
      console.error("Invitation email provider request failed.", {
        invitationId,
        status: response.status,
      });
      await markDelivery(client, invitation, "failed");
      return failure(
        "INVITATION_DELIVERY_FAILED",
        "The invitation was saved, but the email could not be sent. You can retry from the Team screen.",
        502,
      );
    }

    await markDelivery(client, invitation, "sent");
    return jsonResponse({ data: invitation, ok: true });
  } catch (error) {
    console.error("Invitation email delivery failed.", { error, invitationId });
    await markDelivery(client, invitation, "failed");
    return failure(
      "INVITATION_DELIVERY_FAILED",
      "The invitation was saved, but the email could not be sent. You can retry from the Team screen.",
      502,
    );
  }
}

async function markDelivery(
  client: SupabaseClient,
  invitation: JsonRecord,
  status: "failed" | "sent",
) {
  const { error } = await client.rpc("set_project_invitation_delivery", {
    p_delivery_status: status,
    p_delivery_version: requirePositiveInteger(invitation.delivery_version),
    p_invitation_id: requireUuid(invitation.id),
  });

  if (error) {
    console.error("Could not update invitation delivery state.", error);
  }
}

function createUserClient(request: Request) {
  const publishableKey = getPublishableKey();

  if (!supabaseUrl || !publishableKey) {
    return null;
  }

  return createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { Authorization: request.headers.get("Authorization") ?? "" },
    },
  });
}

function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getPublishableKey() {
  const namedKeys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");

  if (namedKeys) {
    try {
      return (
        Object.values(JSON.parse(namedKeys)).find(
          (value): value is string => typeof value === "string",
        ) ?? null
      );
    } catch {
      return null;
    }
  }

  return (
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY") ??
      null
  );
}

function rpcResult({ data, error }: { data: unknown; error: unknown }) {
  return error ? rpcError(error) : jsonResponse({ data, ok: true });
}

function rpcError(error: unknown) {
  console.error("Project collaboration database request failed.", error);
  const message = databasePublicMessage(error);
  const status = message.includes("cannot") || message.includes("unavailable")
    ? 403
    : message.includes("limit") || message.includes("Wait")
    ? 429
    : 400;

  return failure("COLLABORATION_DATABASE_REJECTED", message, status);
}

export function databasePublicMessage(error: unknown) {
  const message = isRecord(error) && typeof error.message === "string"
    ? error.message
    : "";
  const allowed = [
    "You cannot invite members to this project.",
    "This person is already a project member.",
    "The project owner is already part of this project.",
    "The selected project role is unavailable.",
    "This invitation is unavailable.",
    "Only pending invitations can be resent.",
    "Wait before resending this invitation.",
    "The daily invitation email limit has been reached.",
    "This invitation has already been resolved.",
    "This project member is unavailable.",
    "You are not an active member of this project.",
  ];

  return allowed.includes(message)
    ? message
    : "We couldn't complete that collaboration action. Try again.";
}

function failure(code: string, error: string, status: number) {
  return jsonResponse({ code, error, ok: false }, { status });
}

function configurationFailure() {
  return failure(
    "COLLABORATION_UNAVAILABLE",
    "Project collaboration is temporarily unavailable. Try again later.",
    503,
  );
}

class PublicInputError extends Error {}

function requireUuid(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(
        value,
      )
  ) {
    throw new PublicInputError("A valid identifier is required.");
  }
  return value;
}

export function requireEmail(value: unknown) {
  if (
    typeof value !== "string" ||
    value.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  ) {
    throw new PublicInputError("Enter a valid email address.");
  }
  return value.trim().toLowerCase();
}

export function requireRoleCode(value: unknown) {
  if (typeof value !== "string" || !/^[a-z][a-z0-9_]{1,39}$/.test(value)) {
    throw new PublicInputError("Select a valid project role.");
  }
  return value;
}

export function requireToken(value: unknown) {
  if (typeof value !== "string" || value.length < 32 || value.length > 200) {
    throw new PublicInputError("This invitation link is invalid.");
  }
  return value;
}

function requirePositiveInteger(value: unknown) {
  const result = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(result) || result < 1) {
    throw new PublicInputError("The invitation delivery state is invalid.");
  }
  return result;
}

function requirePage(value: unknown) {
  const page = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(page) || page < 0) {
    throw new PublicInputError("A valid page is required.");
  }
  return page;
}

function requirePageSize(value: unknown) {
  const pageSize = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    throw new PublicInputError("A valid page size is required.");
  }
  return pageSize;
}

function requireVerifiedEmail(user: User) {
  if (!user.email || !user.email_confirmed_at) {
    throw new PublicInputError(
      "Verify your email address before responding to this invitation.",
    );
  }
}

function createToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function sevenDaysFromNow() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

function displayName(value: unknown) {
  if (!isRecord(value)) return "";
  const first = typeof value.first_name === "string"
    ? value.first_name
    : typeof value.full_name === "string"
    ? value.full_name
    : "";
  const last = typeof value.last_name === "string" ? value.last_name : "";
  return `${first} ${last}`.trim();
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default { fetch: handler };
