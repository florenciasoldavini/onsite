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
import { useLocalization } from "@/features/localization/hooks/use-localization";
import { getProjectRoleLabel } from "@/features/projects/utils/project-role-label";
import { useTranslation } from "react-i18next";

export function ProjectInvitationLandingContent({
  invitation
}: {
  invitation: NonNullable<
    ReturnType<typeof useProjectInvitationPreview>["data"]
  >;
}) {
  const router = useRouter();
  const { language } = useLocalization();
  const { t } = useTranslation("features/projects");
  const { session } = useAuth();
  const available = invitation.status === "pending";

  return (
    <Screen centered>
      <AppCard padding="lg" style={{ maxWidth: 560, width: "100%" }}>
        <View style={{ gap: atomSpacing[4] }}>
          <MailIcon color={atomPalette.accent} size="lg" />
          <AppHeading selectable variant="hero">
            {t(($) => $["features/projects"].invitations.join, {
              project: invitation.projectName
            })}
          </AppHeading>
          <AppText selectable tone="muted">
            {t(($) => $["features/projects"].invitations.invitedAs, {
              inviter: invitation.inviterName,
              role: getProjectRoleLabel(
                invitation.roleCode,
                language,
                invitation.roleName
              )
            })}
          </AppText>
          {!available ? (
            <AppText selectable tone="danger">
              {t(($) => $["features/projects"].invitations.invalidStatus, {
                status: t(
                  ($) =>
                    $["features/projects"].invitationStatuses[
                      invitation.status
                    ]
                )
              })}
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
              {t(($) => $["features/projects"].invitations.review)}
            </AppButton>
          ) : (
            <View style={{ gap: atomSpacing[3] }}>
              <AppText tone="muted" variant="bodySm">
                {t(
                  ($) =>
                    $["features/projects"].invitations.signInDescription
                )}
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
                {t(($) => $["features/projects"].invitations.signIn)}
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
                {t(
                  ($) => $["features/projects"].invitations.createAccount
                )}
              </AppButton>
            </View>
          )}
        </View>
      </AppCard>
    </Screen>
  );
}
