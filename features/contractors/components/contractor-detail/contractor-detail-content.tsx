import { useSoftDeleteContractor } from "@/features/contractors/hooks/use-contractors";
import {
  getContractorDisplayName,
  getContractorInitials
} from "@/features/contractors/schemas/contractor.schema";
import type { Contractor } from "@/features/contractors/types/contractor";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppCard } from "@/shared/ui/components/card";
import {
  DestructiveConfirmationDialog,
  useDestructiveConfirmation
} from "@/shared/ui/components/destructive-confirmation-dialog";
import { AppHeading } from "@/shared/ui/components/heading";
import { Screen } from "@/shared/ui/components/screen";
import { AppText } from "@/shared/ui/components/text";
import { useAppToast } from "@/shared/ui/components/toast";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { MailIcon, PencilIcon, PhoneIcon, TrashIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";

export function ContractorDetailContent({
  contractor
}: {
  contractor: Contractor;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/contractors");
  const { t: tShared } = useTranslation("shared");
  const { isCompact } = useLayoutMode();
  const toast = useAppToast();
  const deleteMutation = useSoftDeleteContractor();
  const deleteConfirmation = useDestructiveConfirmation();
  const [contactError, setContactError] = useState<string | null>(null);
  const displayName = getContractorDisplayName(contractor);

  const deleteContractor = async () => {
    deleteConfirmation.clearError();
    try {
      await deleteMutation.mutateAsync(contractor.id);
      deleteConfirmation.close();
      toast.show({
        description: t(
          ($) => $["features/contractors"].detail.deletedDescription,
          { name: displayName }
        ),
        title: t(($) => $["features/contractors"].detail.deletedTitle),
        tone: "success"
      });
      router.replace("/directory?section=contractors" as never);
    } catch (error) {
      deleteConfirmation.setError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/contractors"].errors.delete)
        )
      );
    }
  };

  const openContactAction = async (url: string, fallbackMessage: string) => {
    setContactError(null);
    try {
      await Linking.openURL(url);
    } catch {
      setContactError(fallbackMessage);
    }
  };

  return (
    <Screen>
      <View style={styles.page}>
        <Breadcrumb
          items={[
            {
              accessibilityLabel: t(
                ($) =>
                  $["features/contractors"].accessibility.backToDirectory
              ),
              label: t(
                ($) => $["features/contractors"].breadcrumbs.contractors
              ),
              onPress: () =>
                router.replace("/directory?section=contractors" as never)
            },
            {
              label: t(
                ($) => $["features/contractors"].breadcrumbs.detail
              )
            }
          ]}
        />

        <AppCard padding={isCompact ? "md" : "lg"}>
          <View
            style={[
              styles.identityLayout,
              isCompact ? styles.identityLayoutCompact : null
            ]}
          >
            <View style={styles.identityContent}>
              <View style={styles.avatar}>
                <AppText tone="accent" variant="label">
                  {getContractorInitials(contractor)}
                </AppText>
              </View>
              <View style={styles.identityCopy}>
                <AppText tone="accent" variant="eyebrow">
                  {t(($) => $["features/contractors"].detail.profile)}
                </AppText>
                <AppHeading variant="hero">{displayName}</AppHeading>
                <AppText tone="muted">
                  {t(
                    ($) =>
                      $["features/contractors"].detail.profileDescription
                  )}
                </AppText>
              </View>
            </View>

            <View
              style={[
                styles.identityActions,
                isCompact ? styles.identityActionsCompact : null
              ]}
            >
              <AppButton
                color="neutral"
                fullWidth={isCompact}
                icon={PencilIcon}
                iconAfter={false}
                onPress={() =>
                  router.push(`/contractors/${contractor.id}/edit` as never)
                }
                size="sm"
                variant="bordered"
              >
                {tShared(($) => $.shared.actions.edit)}
              </AppButton>
              <AppButton
                color="danger"
                fullWidth={isCompact}
                icon={TrashIcon}
                iconAfter={false}
                onPress={deleteConfirmation.open}
                size="sm"
                variant="bordered"
              >
                {tShared(($) => $.shared.actions.delete)}
              </AppButton>
            </View>
          </View>
        </AppCard>

        <AppCard padding="lg">
          <View style={{ gap: atomSpacing[4] }}>
            <View style={styles.sectionHeading}>
              <AppHeading variant="section">
                {t(($) => $["features/contractors"].detail.contactDetails)}
              </AppHeading>
              <AppText tone="subtle" variant="meta">
                {t(($) => $["features/contractors"].detail.primary)}
              </AppText>
            </View>
            <ContactRow
              action={
                contractor.phone_number
                  ? {
                      label: t(
                        ($) => $["features/contractors"].actions.call
                      ),
                      onPress: () =>
                        void openContactAction(
                          `tel:${contractor.phone_number}`,
                          t(
                            ($) =>
                              $["features/contractors"].detail.phoneError
                          )
                        )
                    }
                  : undefined
              }
              icon={PhoneIcon}
              label={t(($) => $["features/contractors"].detail.phone)}
              value={
                contractor.phone_number ??
                t(($) => $["features/contractors"].detail.notProvided)
              }
            />
            <ContactRow
              action={
                contractor.email
                  ? {
                      label: t(
                        ($) => $["features/contractors"].detail.email
                      ),
                      onPress: () =>
                        void openContactAction(
                          `mailto:${contractor.email}`,
                          t(
                            ($) =>
                              $["features/contractors"].detail.emailError
                          )
                        )
                    }
                  : undefined
              }
              icon={MailIcon}
              label={t(($) => $["features/contractors"].detail.email)}
              value={
                contractor.email ??
                t(($) => $["features/contractors"].detail.notProvided)
              }
            />
            {contactError ? (
              <AppText selectable tone="danger">
                {contactError}
              </AppText>
            ) : null}
          </View>
        </AppCard>
      </View>

      <DestructiveConfirmationDialog
        accessibilityLabel={t(
          ($) => $["features/contractors"].accessibility.cancelDelete
        )}
        confirmLabel={t(($) => $["features/contractors"].actions.delete)}
        controller={deleteConfirmation}
        description={t(($) => $["features/contractors"].delete.description)}
        isPending={deleteMutation.isPending}
        onConfirm={deleteContractor}
        title={t(($) => $["features/contractors"].delete.title, {
          name: displayName
        })}
      />
    </Screen>
  );
}

function ContactRow({
  action,
  icon: Icon,
  label,
  value
}: {
  action?: { label: string; onPress: () => void };
  icon: typeof PhoneIcon;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.contactRow}>
      <View style={styles.contactIcon}>
        <Icon color={atomPalette.accent} size="md" />
      </View>
      <View style={{ flex: 1, gap: atomSpacing[1] }}>
        <AppText tone="subtle" variant="meta">
          {label}
        </AppText>
        <AppText selectable>{value}</AppText>
      </View>
      {action ? (
        <AppButton
          color="neutral"
          fullWidth={false}
          onPress={action.onPress}
          size="sm"
          variant="bordered"
        >
          {action.label}
        </AppButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: `${atomPalette.accent}14`,
    borderColor: `${atomPalette.accent}28`,
    borderRadius: 999,
    borderWidth: 1,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  contactIcon: {
    alignItems: "center",
    backgroundColor: `${atomPalette.accent}0d`,
    borderRadius: atomRadii.md,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  contactRow: {
    alignItems: "center",
    backgroundColor: atomPalette.surfaceLow,
    borderColor: atomPalette.borderSubtle,
    borderRadius: atomRadii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: atomSpacing[3],
    padding: atomSpacing[4]
  },
  identityActions: {
    flexDirection: "row",
    gap: atomSpacing[2]
  },
  identityActionsCompact: {
    alignSelf: "stretch"
  },
  identityContent: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: atomSpacing[4],
    minWidth: 0
  },
  identityCopy: {
    flex: 1,
    gap: atomSpacing[1],
    minWidth: 0
  },
  identityLayout: {
    alignItems: "center",
    flexDirection: "row",
    gap: atomSpacing[5],
    justifyContent: "space-between"
  },
  identityLayoutCompact: {
    alignItems: "flex-start",
    flexDirection: "column"
  },
  page: {
    alignSelf: "center",
    gap: atomSpacing[5],
    maxWidth: 900,
    width: "100%"
  },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: atomSpacing[3],
    justifyContent: "space-between"
  }
});
