import {
  useMyProjectInvitations,
  useRespondProjectInvitation
} from "@/features/projects/hooks/use-project-collaboration";
import type { MyProjectInvitation } from "@/features/projects/types/project-participant";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { AppHeading } from "@/shared/ui/components/heading";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import { AlertIcon, MailIcon, RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { View } from "react-native";

export function ProjectInvitationsScreen({
  highlightedInvitationId
}: {
  highlightedInvitationId?: string;
}) {
  const invitationsQuery = useMyProjectInvitations();
  const invitations =
    invitationsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (invitationsQuery.isLoading) {
    return (
      <Screen>
        <View style={{ gap: atomSpacing[4] }}>
          <SkeletonBlock height={48} width="60%" />
          <SkeletonBlock height={150} />
        </View>
      </Screen>
    );
  }

  if (invitationsQuery.isError) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void invitationsQuery.refetch()
          }}
          description={getUserFacingErrorMessage(
            invitationsQuery.error,
            "We couldn't load your project invitations. Try again."
          )}
          icon={AlertIcon}
          title="Invitations unavailable"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: atomSpacing[6] }}>
        <NavScreenHeader
          breadcrumbLabel="Invitations"
          description="Review projects that other Onzait users shared with you."
          title="Project invitations"
        />
        {invitations.length ? (
          invitations.map((invitation) => (
            <InvitationCard
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
  );
}

function InvitationCard({
  highlighted,
  invitation
}: {
  highlighted: boolean;
  invitation: MyProjectInvitation;
}) {
  const router = useRouter();
  const response = useRespondProjectInvitation();

  const respond = async (nextResponse: "accept" | "decline") => {
    try {
      await response.mutateAsync({
        invitationId: invitation.id,
        response: nextResponse
      });
      if (nextResponse === "accept") {
        router.replace(`/projects/${invitation.projectId}` as never);
      }
    } catch {
      // The mutation error is rendered below with safe product wording.
    }
  };

  return (
    <AppCard
      padding="lg"
      style={highlighted ? { borderColor: "#0055ff", borderWidth: 2 } : null}
    >
      <View style={{ gap: atomSpacing[3] }}>
        <AppHeading selectable variant="section">
          {invitation.projectName}
        </AppHeading>
        <AppText selectable tone="muted">
          {invitation.inviterName} invited you as {invitation.roleCode}.
        </AppText>
        {response.isError ? (
          <AppText selectable tone="danger">
            {getUserFacingErrorMessage(
              response.error,
              "We couldn't respond to this invitation. Try again."
            )}
          </AppText>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: atomSpacing[3]
          }}
        >
          <AppButton
            fullWidth={false}
            isDisabled={response.isPending}
            loading={response.isPending}
            onPress={() => void respond("accept")}
          >
            Accept
          </AppButton>
          <AppButton
            color="neutral"
            fullWidth={false}
            isDisabled={response.isPending}
            onPress={() => void respond("decline")}
            variant="bordered"
          >
            Decline
          </AppButton>
        </View>
      </View>
    </AppCard>
  );
}
