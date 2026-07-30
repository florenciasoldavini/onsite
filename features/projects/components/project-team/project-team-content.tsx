import {
  InviteMemberCard,
  MembersCard,
  PendingInvitationsCard
} from "@/features/projects/components/project-team/project-team-cards";
import {
  useLeaveProject,
  useProjectAccess,
  useProjectRoles,
  useProjectTeam
} from "@/features/projects/hooks/use-project-collaboration";
import { AppButton } from "@/shared/ui/components/button";
import {
  DestructiveConfirmationDialog,
  useDestructiveConfirmation
} from "@/shared/ui/components/destructive-confirmation-dialog";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { atomSpacing } from "@/shared/ui/components/theme";
import { RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export function ProjectTeamContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { t } = useTranslation("features/projects");
  const { t: tShared } = useTranslation("shared");
  const accessQuery = useProjectAccess(projectId);
  const teamQuery = useProjectTeam(projectId);
  const rolesQuery = useProjectRoles();
  const team = useMemo(() => {
    const pages = teamQuery.data?.pages;
    const first = pages?.[0];
    if (!first) return null;
    return {
      invitations: pages.flatMap((page) => page.invitations),
      members: pages.flatMap((page) => page.members),
      owner: first.owner
    };
  }, [teamQuery.data]);
  const canManage = accessQuery.can("project.members.manage");
  const canRead = accessQuery.can("project.members.read");
  const leaveMutation = useLeaveProject(projectId);
  const leaveConfirmation = useDestructiveConfirmation();

  const confirmLeave = async () => {
    leaveConfirmation.clearError();
    try {
      await leaveMutation.mutateAsync(undefined);
      leaveConfirmation.close();
      router.replace("/projects" as never);
    } catch (error) {
      leaveConfirmation.setError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/projects"].team.leaveError)
        )
      );
    }
  };

  const isLoading =
    accessQuery.isLoading || teamQuery.isLoading || rolesQuery.isLoading;
  const error = accessQuery.error ?? teamQuery.error ?? rolesQuery.error;

  return (
    <RouteStateBoundary
      feedback={{
        forbidden: {
          action: {
            label: t(($) => $["features/projects"].actions.backProject),
            onPress: () => router.replace(`/projects/${projectId}` as never)
          },
          description: t(($) => $["features/projects"].team.forbidden)
        },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: tShared(($) => $.shared.actions.retry),
            onPress: () => {
              void Promise.all([
                accessQuery.refetch(),
                teamQuery.refetch(),
                rolesQuery.refetch()
              ]);
            }
          },
          description: getUserFacingErrorMessage(
            error,
            t(($) => $["features/projects"].team.load)
          )
        }
      }}
      isError={
        accessQuery.isError ||
        teamQuery.isError ||
        rolesQuery.isError ||
        (!isLoading && !team)
      }
      isForbidden={!canRead}
      isLoading={isLoading}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={48} width="60%" />
            <SkeletonBlock height={180} />
            <SkeletonBlock height={240} />
          </View>
        </Screen>
      }
      resourceName="team"
    >
      {team ? (
        <Screen>
          <View style={{ gap: atomSpacing[6] }}>
            <NavScreenHeader
              action={
                accessQuery.data &&
                !accessQuery.data.isOwner &&
                !accessQuery.data.isAdmin ? (
                  <AppButton
                    color="danger"
                    fullWidth={false}
                    onPress={leaveConfirmation.open}
                    size="sm"
                    variant="bordered"
                  >
                    {t(($) => $["features/projects"].invitations.leave)}
                  </AppButton>
                ) : null
              }
              breadcrumbLabel={t(
                ($) => $["features/projects"].team.title
              )}
              description={t(
                ($) => $["features/projects"].team.description
              )}
              title={t(($) => $["features/projects"].team.title)}
            />
            {canManage ? (
              <InviteMemberCard
                projectId={projectId}
                roles={rolesQuery.data ?? []}
              />
            ) : null}
            <DestructiveConfirmationDialog
              accessibilityLabel={t(
                ($) => $["features/projects"].invitations.leave
              )}
              confirmLabel={t(
                ($) => $["features/projects"].invitations.leave
              )}
              controller={leaveConfirmation}
              description={t(
                ($) => $["features/projects"].team.leaveDescription
              )}
              isPending={leaveMutation.isPending}
              onConfirm={confirmLeave}
              title={t(($) => $["features/projects"].team.leaveTitle)}
            />
            <MembersCard
              canManage={canManage}
              members={[team.owner, ...team.members]}
              ownerUserId={team.owner.userId}
              projectId={projectId}
              roles={rolesQuery.data ?? []}
            />
            {canManage ? (
              <PendingInvitationsCard
                invitations={team.invitations}
                projectId={projectId}
                roles={rolesQuery.data ?? []}
              />
            ) : null}
            {teamQuery.hasNextPage ? (
              <AppButton
                color="neutral"
                loading={teamQuery.isFetchingNextPage}
                onPress={() => void teamQuery.fetchNextPage()}
                variant="bordered"
              >
                {t(($) => $["features/projects"].team.loadMore)}
              </AppButton>
            ) : null}
          </View>
        </Screen>
      ) : null}
    </RouteStateBoundary>
  );
}
