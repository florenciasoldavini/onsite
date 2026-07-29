import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProjectInvitationPreview } from "@/features/projects/hooks/use-project-collaboration";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { AppHeading } from "@/shared/ui/components/heading";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import { atomPalette } from "@/shared/ui/components/theme";
import { AlertIcon, MailIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { View } from "react-native";

export function ProjectInvitationAcceptScreen({ token }: { token?: string }) {
  const router = useRouter();
  const { session } = useAuth();
  const preview = useProjectInvitationPreview(token);

  if (!token) {
    return (
      <Screen centered>
        <EmptyState
          description="Open the complete link from your invitation email."
          icon={AlertIcon}
          title="Invitation link incomplete"
        />
      </Screen>
    );
  }

  if (preview.isLoading) {
    return (
      <Screen centered>
        <SkeletonBlock height={260} width="100%" />
      </Screen>
    );
  }

  if (preview.isError || !preview.data) {
    return (
      <Screen centered>
        <EmptyState
          description={getUserFacingErrorMessage(
            preview.error,
            "This invitation is invalid or no longer available."
          )}
          icon={AlertIcon}
          title="Invitation unavailable"
        />
      </Screen>
    );
  }

  const invitation = preview.data;
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
