import {
  parseInvitationPreview,
  parseMyInvitations,
  parseProjectAccess,
  parseProjectTeam,
  parseRoleOptions
} from "@/features/projects/schemas/project-participant.schema";
import {
  requireSupabase,
  toRepositoryError
} from "@/infrastructure/supabase/repository";
import { UserFacingError } from "@/shared/utils/user-facing-errors";

type CollaborationBody = Record<string, unknown> & { action: string };

export async function getProjectAccessRow(projectId: string) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("get_project_access", {
    p_project_id: projectId
  });

  if (error) throw toRepositoryError(error);
  return data ? parseProjectAccess(data) : null;
}

export async function listProjectRoleRows() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_roles")
    .select("code, description, display_name, sort_order")
    .eq("is_assignable", true)
    .is("retired_at", null)
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true })
    .limit(50);

  if (error) throw toRepositoryError(error);
  return parseRoleOptions(data ?? []);
}

export async function listProjectTeamRows(projectId: string, page = 0) {
  const data = await invokeCollaboration({
    action: "list-members",
    page,
    pageSize: 50,
    projectId
  });
  return parseProjectTeam(data);
}

export async function listMyProjectInvitationRows(page = 0) {
  return parseMyInvitations(
    await invokeCollaboration({
      action: "list-invitations",
      page,
      pageSize: 50
    })
  );
}

export async function previewProjectInvitationRow(token: string) {
  return parseInvitationPreview(
    await invokeCollaboration({ action: "preview", token })
  );
}

export function createProjectInvitationRow(input: {
  email: string;
  projectId: string;
  roleCode: string;
}) {
  return invokeCollaboration({ action: "invite", ...input });
}

export function resendProjectInvitationRow(invitationId: string) {
  return invokeCollaboration({ action: "resend", invitationId });
}

export function respondProjectInvitationRow(
  invitationId: string,
  response: "accept" | "decline"
) {
  return invokeCollaboration({ action: response, invitationId });
}

export function revokeProjectInvitationRow(invitationId: string) {
  return invokeCollaboration({ action: "revoke", invitationId });
}

export function updateProjectMemberRoleRow(
  membershipId: string,
  roleCode: string
) {
  return invokeCollaboration({
    action: "update-role",
    membershipId,
    roleCode
  });
}

export function removeProjectMemberRow(membershipId: string) {
  return invokeCollaboration({ action: "remove-member", membershipId });
}

export function leaveProjectRow(projectId: string) {
  return invokeCollaboration({ action: "leave", projectId });
}

async function invokeCollaboration(body: CollaborationBody) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke<{
    code?: string;
    data?: unknown;
    error?: string;
    ok: boolean;
  }>("project-collaboration", { body });

  if (error) {
    const response = (error as { context?: Response }).context;
    const failure = response
      ? await response
          .clone()
          .json()
          .catch(() => null)
      : null;
    const message =
      typeof failure === "object" &&
      failure !== null &&
      "error" in failure &&
      typeof failure.error === "string"
        ? failure.error
        : "We couldn't complete that collaboration action. Try again.";

    throw new UserFacingError(message, error);
  }

  if (!data?.ok) {
    throw new UserFacingError(
      data?.error ??
        "We couldn't complete that collaboration action. Try again."
    );
  }

  return data.data;
}
