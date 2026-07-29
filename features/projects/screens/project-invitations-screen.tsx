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

export function ProjectInvitationsScreen({
  highlightedInvitationId
}: {
  highlightedInvitationId?: string;
}) {
  const invitationsQuery = useMyProjectInvitations();
  const invitations =
    invitationsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <RouteStateBoundary
      feedback={{
        loadError: {
          action: {
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void invitationsQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            invitationsQuery.error,
            "We couldn't load your project invitations. Try again."
          ),
          icon: AlertIcon,
          title: "Invitations unavailable"
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
            breadcrumbLabel="Invitations"
            description="Review projects that other Onzait users shared with you."
            title="Project invitations"
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
              description="When someone invites your verified email to a project, it will appear here."
              icon={MailIcon}
              title="No pending invitations"
            />
          )}
          {invitationsQuery.hasNextPage ? (
            <AppButton
              color="neutral"
              loading={invitationsQuery.isFetchingNextPage}
              onPress={() => void invitationsQuery.fetchNextPage()}
              variant="bordered"
            >
              Load more invitations
            </AppButton>
          ) : null}
        </View>
      </Screen>
    </RouteStateBoundary>
  );
}
