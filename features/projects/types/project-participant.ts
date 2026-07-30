export const PROJECT_PERMISSION_CODES = [
  "project.change_client",
  "project.cover.write",
  "project.delete",
  "project.documents.write",
  "project.members.manage",
  "project.members.read",
  "project.photos.write",
  "project.read",
  "project.tasks.write",
  "project.update"
] as const;

export type ProjectPermissionCode = (typeof PROJECT_PERMISSION_CODES)[number];
export type ProjectRoleCode = string;

export interface ProjectAccess {
  isAdmin: boolean;
  isOwner: boolean;
  permissions: ProjectPermissionCode[];
  projectId: string;
  role: ProjectRoleCode;
}

export interface ProjectRoleOption {
  code: ProjectRoleCode;
  description: string;
  displayName: string;
  sortOrder: number;
}

export interface ProjectMemberSummary {
  email: string;
  firstName: string;
  id: string;
  joinedAt: string | null;
  lastName: string | null;
  roleCode: ProjectRoleCode;
  userId: string;
}

export type ProjectInvitationStatus =
  | "accepted"
  | "declined"
  | "expired"
  | "pending"
  | "revoked";

export type ProjectInvitationDeliveryStatus = "failed" | "pending" | "sent";

export interface ProjectInvitationSummary {
  createdAt: string;
  deliveryStatus: ProjectInvitationDeliveryStatus;
  email: string;
  expiresAt: string;
  id: string;
  lastSentAt: string | null;
  roleCode: ProjectRoleCode;
  status: ProjectInvitationStatus;
}

export interface ProjectTeam {
  invitations: ProjectInvitationSummary[];
  members: ProjectMemberSummary[];
  owner: ProjectMemberSummary;
}

export interface ProjectTeamPage extends ProjectTeam {
  hasMore: boolean;
  nextPage: number | null;
}

export interface MyProjectInvitation {
  createdAt: string;
  expiresAt: string;
  id: string;
  inviterName: string;
  projectId: string;
  projectName: string;
  roleCode: ProjectRoleCode;
}

export interface MyProjectInvitationPage {
  hasMore: boolean;
  items: MyProjectInvitation[];
  nextPage: number | null;
}

export interface ProjectInvitationPreview {
  expiresAt: string;
  id: string;
  inviterName: string;
  projectName: string;
  roleCode: ProjectRoleCode;
  roleName: string;
  status: ProjectInvitationStatus;
}
