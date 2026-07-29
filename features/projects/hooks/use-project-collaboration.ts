import {
  acceptProjectInvitation,
  declineProjectInvitation,
  getProjectAccess,
  inviteProjectMember,
  leaveProject,
  listMyProjectInvitations,
  listProjectRoles,
  listProjectTeam,
  previewProjectInvitation,
  removeProjectMember,
  resendProjectInvitation,
  revokeProjectInvitation,
  updateProjectMemberRole
} from "@/features/projects/services/project-collaboration.service";
import type {
  MyProjectInvitationPage,
  ProjectPermissionCode,
  ProjectRoleCode,
  ProjectTeamPage
} from "@/features/projects/types/project-participant";
import { canAccessProject } from "@/features/projects/schemas/project-participant.schema";
import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData
} from "@tanstack/react-query";

export const projectAccessKey = (projectId: string) =>
  ["projects", "access", projectId] as const;
export const projectTeamKey = (projectId: string) =>
  ["projects", "team", projectId] as const;
const invitationsKey = ["project-invitations"] as const;

export function useProjectAccess(projectId?: string) {
  const query = useQuery({
    enabled: Boolean(projectId),
    queryFn: () => getProjectAccess(projectId!),
    queryKey: projectAccessKey(projectId ?? "")
  });

  return {
    ...query,
    can: (permission: ProjectPermissionCode) =>
      canAccessProject(query.data, permission)
  };
}

export function useProjectPermission(
  projectId: string | undefined,
  permission: ProjectPermissionCode
) {
  const accessQuery = useProjectAccess(projectId);
  return {
    ...accessQuery,
    allowed: accessQuery.can(permission)
  };
}

export function useProjectRoles() {
  return useQuery({
    queryFn: listProjectRoles,
    queryKey: ["projects", "roles"],
    staleTime: 30 * 60_000
  });
}

export function useProjectTeam(projectId?: string) {
  return useInfiniteQuery<
    ProjectTeamPage,
    Error,
    InfiniteData<ProjectTeamPage>,
    ReturnType<typeof projectTeamKey>,
    number
  >({
    enabled: Boolean(projectId),
    getNextPageParam: (page) => page.nextPage ?? undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => listProjectTeam(projectId!, pageParam),
    queryKey: projectTeamKey(projectId ?? "")
  });
}

export function useMyProjectInvitations() {
  return useInfiniteQuery<
    MyProjectInvitationPage,
    Error,
    InfiniteData<MyProjectInvitationPage>,
    typeof invitationsKey,
    number
  >({
    getNextPageParam: (page) => page.nextPage ?? undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => listMyProjectInvitations(pageParam),
    queryKey: invitationsKey
  });
}

export function useProjectInvitationPreview(token?: string) {
  return useQuery({
    enabled: Boolean(token),
    queryFn: () => previewProjectInvitation(token!),
    queryKey: [...invitationsKey, "preview", token],
    retry: false
  });
}

export function useInviteProjectMember(projectId: string) {
  return useCollaborationMutation(
    (input: { email: string; roleCode: ProjectRoleCode }) =>
      inviteProjectMember(projectId, input),
    projectId
  );
}

export function useResendProjectInvitation(projectId: string) {
  return useCollaborationMutation(resendProjectInvitation, projectId);
}

export function useRespondProjectInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invitationId,
      response
    }: {
      invitationId: string;
      response: "accept" | "decline";
    }) =>
      response === "accept"
        ? acceptProjectInvitation(invitationId)
        : declineProjectInvitation(invitationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invitationsKey }),
        queryClient.invalidateQueries({ queryKey: ["projects"] })
      ]);
    }
  });
}

export function useRevokeProjectInvitation(projectId: string) {
  return useCollaborationMutation(revokeProjectInvitation, projectId);
}

export function useUpdateProjectMemberRole(projectId: string) {
  return useCollaborationMutation(
    ({
      membershipId,
      roleCode
    }: {
      membershipId: string;
      roleCode: ProjectRoleCode;
    }) => updateProjectMemberRole(membershipId, roleCode),
    projectId
  );
}

export function useRemoveProjectMember(projectId: string) {
  return useCollaborationMutation(removeProjectMember, projectId);
}

export function useLeaveProject(projectId: string) {
  return useCollaborationMutation(() => leaveProject(projectId), projectId);
}

function useCollaborationMutation<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
  projectId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectTeamKey(projectId) }),
        queryClient.invalidateQueries({
          queryKey: projectAccessKey(projectId)
        }),
        queryClient.invalidateQueries({ queryKey: invitationsKey }),
        queryClient.invalidateQueries({ queryKey: ["projects"] })
      ]);
    }
  });
}
