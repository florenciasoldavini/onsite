import {
  PROJECT_PERMISSION_CODES,
  type MyProjectInvitation,
  type MyProjectInvitationPage,
  type ProjectAccess,
  type ProjectInvitationPreview,
  type ProjectRoleOption,
  type ProjectTeamPage
} from "@/features/projects/types/project-participant";
import type { ProjectPermissionCode } from "@/features/projects/types/project-participant";
import { z } from "zod";

const roleCodeSchema = z.string().regex(/^[a-z][a-z0-9_]{1,39}$/);
const permissionSchema = z.enum(PROJECT_PERMISSION_CODES);

export const projectInviteInputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  roleCode: roleCodeSchema
});

export type ProjectInviteInput = z.infer<typeof projectInviteInputSchema>;

export function parseProjectAccess(value: unknown): ProjectAccess {
  const result = z
    .object({
      is_admin: z.boolean(),
      is_owner: z.boolean(),
      permissions: z.array(permissionSchema),
      project_id: z.string().uuid(),
      role: z.string().min(1)
    })
    .parse(value);

  return {
    isAdmin: result.is_admin,
    isOwner: result.is_owner,
    permissions: result.permissions,
    projectId: result.project_id,
    role: result.role
  };
}

export function canAccessProject(
  access: ProjectAccess | null | undefined,
  permission: ProjectPermissionCode
) {
  return Boolean(access?.permissions.includes(permission));
}

export function parseRoleOptions(value: unknown): ProjectRoleOption[] {
  return z
    .array(
      z.object({
        code: roleCodeSchema,
        description: z.string(),
        display_name: z.string(),
        sort_order: z.number()
      })
    )
    .parse(value)
    .map((role) => ({
      code: role.code,
      description: role.description,
      displayName: role.display_name,
      sortOrder: role.sort_order
    }));
}

const memberSchema = z.object({
  email: z.string(),
  first_name: z.string(),
  id: z.string().uuid().optional(),
  joined_at: z.string().nullable().optional(),
  last_name: z.string().nullable(),
  role_code: roleCodeSchema,
  user_id: z.string().uuid()
});

export function parseProjectTeam(value: unknown): ProjectTeamPage {
  const result = z
    .object({
      invitations: z.array(
        z.object({
          created_at: z.string(),
          delivery_status: z.enum(["failed", "pending", "sent"]),
          email: z.string(),
          expires_at: z.string(),
          id: z.string().uuid(),
          last_sent_at: z.string().nullable(),
          role_code: roleCodeSchema,
          status: z.enum([
            "accepted",
            "declined",
            "expired",
            "pending",
            "revoked"
          ])
        })
      ),
      has_more: z.boolean(),
      members: z.array(memberSchema.extend({ id: z.string().uuid() })),
      next_page: z.number().int().nonnegative().nullable(),
      owner: memberSchema
    })
    .parse(value);

  const mapMember = (member: z.infer<typeof memberSchema>) => ({
    email: member.email,
    firstName: member.first_name,
    id: member.id ?? member.user_id,
    joinedAt: member.joined_at ?? null,
    lastName: member.last_name,
    roleCode: member.role_code,
    userId: member.user_id
  });

  return {
    invitations: result.invitations.map((invitation) => ({
      createdAt: invitation.created_at,
      deliveryStatus: invitation.delivery_status,
      email: invitation.email,
      expiresAt: invitation.expires_at,
      id: invitation.id,
      lastSentAt: invitation.last_sent_at,
      roleCode: invitation.role_code,
      status: invitation.status
    })),
    hasMore: result.has_more,
    members: result.members.map(mapMember),
    nextPage: result.next_page,
    owner: mapMember(result.owner)
  };
}

export function parseMyInvitations(value: unknown): MyProjectInvitationPage {
  const result = z
    .object({
      has_more: z.boolean(),
      items: z.array(
        z.object({
          created_at: z.string(),
          expires_at: z.string(),
          id: z.string().uuid(),
          inviter_name: z.string(),
          project_id: z.string().uuid(),
          project_name: z.string(),
          role_code: roleCodeSchema
        })
      ),
      next_page: z.number().int().nonnegative().nullable()
    })
    .parse(value);

  return {
    hasMore: result.has_more,
    items: result.items.map(
      (invitation): MyProjectInvitation => ({
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
        id: invitation.id,
        inviterName: invitation.inviter_name,
        projectId: invitation.project_id,
        projectName: invitation.project_name,
        roleCode: invitation.role_code
      })
    ),
    nextPage: result.next_page
  };
}

export function parseInvitationPreview(
  value: unknown
): ProjectInvitationPreview {
  const result = z
    .object({
      expiresAt: z.string(),
      id: z.string().uuid(),
      inviterName: z.string(),
      projectName: z.string(),
      roleCode: roleCodeSchema,
      roleName: z.string(),
      status: z.enum(["accepted", "declined", "expired", "pending", "revoked"])
    })
    .parse(value);

  return result;
}
