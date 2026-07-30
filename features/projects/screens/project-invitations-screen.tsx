import { ProjectInvitationCard } from "@/features/projects/components/project-invitations/project-invitation-card";
import { useMyProjectInvitations } from "@/features/projects/hooks/use-project-collaboration";
import { AppButton } from "@/shared/ui/components/button";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { atomSpacing } from "@/shared/ui/components/theme";
import { AlertIcon, MailIcon, RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

export function ProjectInvitationsScreen({
  highlightedInvitationId
}: {
  highlightedInvitationId?: string;
}) {
  const { t } = useTranslation("features/projects");
  const { t: tShared } = useTranslation("shared");
  const invitationsQuery = useMyProjectInvitations();
  const invitations =
    invitationsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <RouteStateBoundary
      feedback={{
        loadError: {
          action: {
            icon: RefreshIcon,
            label: tShared(($) => $.shared.actions.retry),
            onPress: () => void invitationsQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            invitationsQuery.error,
            t(($) => $["features/projects"].invitations.listLoad)
          ),
          icon: AlertIcon,
          title: t(($) => $["features/projects"].invitations.unavailable)
        }
      }}
      isError={invitationsQuery.isError}
      isLoading={invitationsQuery.isLoading}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[4] }}>
            <SkeletonBlock height={48} width="60%" />
            <SkeletonBlock height={150} />
          </View>
        </Screen>
      }
      resourceName="invitations"
    >
      <Screen>
        <View style={{ gap: atomSpacing[6] }}>
          <NavScreenHeader
            breadcrumbLabel={t(
              ($) => $["features/projects"].invitations.pending
            )}
            description={t(
              ($) => $["features/projects"].invitations.listDescription
            )}
            title={t(
              ($) => $["features/projects"].invitations.listTitle
            )}
          />
          {invitations.length ? (
            invitations.map((invitation) => (
              <ProjectInvitationCard
                highlighted={invitation.id === highlightedInvitationId}
                invitation={invitation}
                key={invitation.id}
              />
            ))
          ) : (
            <EmptyState
              description={t(
                ($) => $["features/projects"].invitations.emptyDescription
              )}
              icon={MailIcon}
              title={t(
                ($) => $["features/projects"].team.emptyInvitations
              )}
            />
          )}
          {invitationsQuery.hasNextPage ? (
            <AppButton
              color="neutral"
              loading={invitationsQuery.isFetchingNextPage}
              onPress={() => void invitationsQuery.fetchNextPage()}
              variant="bordered"
            >
              {t(($) => $["features/projects"].invitations.loadMore)}
            </AppButton>
          ) : null}
        </View>
      </Screen>
    </RouteStateBoundary>
  );
}
