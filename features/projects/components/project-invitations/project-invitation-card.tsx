import { useRespondProjectInvitation } from "@/features/projects/hooks/use-project-collaboration";
import type { MyProjectInvitation } from "@/features/projects/types/project-participant";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { View } from "react-native";

export function ProjectInvitationCard({
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
