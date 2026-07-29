import {
  createProjectInvitationRow,
  getProjectAccessRow,
  leaveProjectRow,
  listMyProjectInvitationRows,
  listProjectRoleRows,
  listProjectTeamRows,
  previewProjectInvitationRow,
  removeProjectMemberRow,
  resendProjectInvitationRow,
  respondProjectInvitationRow,
  revokeProjectInvitationRow,
  updateProjectMemberRoleRow
} from "@/features/projects/repositories/project-collaboration.repository";
import {
  projectInviteInputSchema,
  type ProjectInviteInput
} from "@/features/projects/schemas/project-participant.schema";

export const getProjectAccess = getProjectAccessRow;
export const listProjectRoles = listProjectRoleRows;
export function listProjectTeam(projectId: string, page: number) {
  return listProjectTeamRows(projectId, page);
}

export function listMyProjectInvitations(page: number) {
  return listMyProjectInvitationRows(page);
}
export const previewProjectInvitation = previewProjectInvitationRow;
export const resendProjectInvitation = resendProjectInvitationRow;
export const revokeProjectInvitation = revokeProjectInvitationRow;
export const removeProjectMember = removeProjectMemberRow;
export const leaveProject = leaveProjectRow;

export function inviteProjectMember(
  projectId: string,
  input: ProjectInviteInput
) {
  const parsed = projectInviteInputSchema.parse(input);
  return createProjectInvitationRow({ projectId, ...parsed });
}

export function acceptProjectInvitation(invitationId: string) {
  return respondProjectInvitationRow(invitationId, "accept");
}

export function declineProjectInvitation(invitationId: string) {
  return respondProjectInvitationRow(invitationId, "decline");
}

export function updateProjectMemberRole(
  membershipId: string,
  roleCode: string
) {
  return updateProjectMemberRoleRow(membershipId, roleCode);
}
