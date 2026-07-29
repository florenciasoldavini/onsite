import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProjectInvitationPreview } from "@/features/projects/hooks/use-project-collaboration";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { Screen } from "@/shared/ui/components/screen";
import { AppText } from "@/shared/ui/components/text";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import { MailIcon } from "@/shared/ui/icons";
import { useRouter } from "expo-router";
import { View } from "react-native";

export function ProjectInvitationLandingContent({
  invitation
}: {
  invitation: NonNullable<
    ReturnType<typeof useProjectInvitationPreview>["data"]
  >;
}) {
  const router = useRouter();
  const { session } = useAuth();
  const available = invitation.status === "pending";

  return (
    <Screen centered>
      <AppCard padding="lg" style={{ maxWidth: 560, width: "100%" }}>
        <View style={{ gap: atomSpacing[4] }}>
          <MailIcon color={atomPalette.accent} size="lg" />
          <AppHeading selectable variant="hero">
            Join {invitation.projectName}
          </AppHeading>
          <AppText selectable tone="muted">
            {invitation.inviterName} invited you as {invitation.roleName}.
          </AppText>
          {!available ? (
            <AppText selectable tone="danger">
              This invitation is {invitation.status}.
            </AppText>
          ) : session ? (
            <AppButton
              isDisabled={!available}
              onPress={() =>
                router.replace(
                  `/invitations?invitation=${invitation.id}` as never
                )
              }
            >
              Review in Onzait
            </AppButton>
          ) : (
            <View style={{ gap: atomSpacing[3] }}>
              <AppText tone="muted" variant="bodySm">
                Sign in or create an account with the invited email address.
              </AppText>
              <AppButton
                onPress={() =>
                  router.push(
                    `/sign-in?next=${encodeURIComponent(
                      `/invitations?invitation=${invitation.id}`
                    )}` as never
                  )
                }
              >
                Sign in
              </AppButton>
              <AppButton
                color="neutral"
                onPress={() =>
                  router.push(
                    `/sign-up?next=${encodeURIComponent(
                      `/invitations?invitation=${invitation.id}`
                    )}` as never
                  )
                }
                variant="bordered"
              >
                Create account
              </AppButton>
            </View>
          )}
        </View>
      </AppCard>
    </Screen>
  );
}
