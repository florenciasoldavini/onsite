import { getContractorDisplayName } from "@/features/contractors/schemas/contractor.schema";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import { getTradeCategoryLabel } from "@/features/trade-categories/constants/trade-category-labels";
import {
  useSoftDeleteWorker,
  useWorker
} from "@/features/workers/hooks/use-workers";
import {
  getWorkerDisplayName,
  getWorkerInitials
} from "@/features/workers/schemas/worker.schema";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppCard } from "@/shared/ui/components/card";
import {
  DestructiveConfirmationDialog,
  useDestructiveConfirmation
} from "@/shared/ui/components/destructive-confirmation-dialog";
import { AppHeading } from "@/shared/ui/components/heading";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { useAppToast } from "@/shared/ui/components/toast";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import {
  HardHatIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  RefreshIcon,
  TrashIcon,
  UserIcon
} from "@/shared/ui/icons";
import type { AppIconComponent } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, StyleSheet, View } from "react-native";

export function WorkerDetailContent({
  worker
}: {
  worker: NonNullable<ReturnType<typeof useWorker>["data"]>;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/workers");
  const { language } = useLocalization();
  const { t: tShared } = useTranslation("shared");
  const { isCompact, isExpanded } = useLayoutMode();
  const toast = useAppToast();
  const deleteMutation = useSoftDeleteWorker();
  const deleteConfirmation = useDestructiveConfirmation();
  const [contactError, setContactError] = useState<string | null>(null);
  const displayName = getWorkerDisplayName(worker);

  const deleteWorker = async () => {
    deleteConfirmation.clearError();
    try {
      await deleteMutation.mutateAsync(worker.id);
      deleteConfirmation.close();
      toast.show({
        description: t(
          ($) => $["features/workers"].detail.deletedDescription,
          { name: displayName }
        ),
        title: t(($) => $["features/workers"].detail.deletedTitle),
        tone: "success"
      });
      router.replace("/directory?section=workers" as never);
    } catch (error) {
      deleteConfirmation.setError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/workers"].errors.delete)
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
              label: t(($) => $["features/workers"].breadcrumbs.workers),
              onPress: () =>
                router.replace("/directory?section=workers" as never)
            },
            { label: t(($) => $["features/workers"].breadcrumbs.detail) }
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
                  {getWorkerInitials(worker)}
                </AppText>
              </View>
              <View style={{ flex: 1, gap: atomSpacing[1] }}>
                <AppText tone="accent" variant="eyebrow">
                  {t(($) => $["features/workers"].detail.profile)}
                </AppText>
                <AppHeading variant="hero">{displayName}</AppHeading>
                <AppText tone="muted">
                  {t(($) => $["features/workers"].detail.profileDescription)}
                </AppText>
              </View>
            </View>
            <View
              style={[styles.actions, isCompact ? styles.actionsCompact : null]}
            >
              <AppButton
                color="neutral"
                fullWidth={isCompact}
                icon={PencilIcon}
                iconAfter={false}
                onPress={() =>
                  router.push(`/workers/${worker.id}/edit` as never)
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

        <View
          style={[
            styles.detailGrid,
            isExpanded ? styles.detailGridExpanded : null
          ]}
        >
          <AppCard padding="lg" style={{ flex: 1 }}>
            <View style={{ gap: atomSpacing[4] }}>
              <AppHeading variant="section">
                {t(($) => $["features/workers"].detail.contactDetails)}
              </AppHeading>
              <DetailRow
                action={
                  worker.phone_number
                    ? {
                        label: t(($) => $["features/workers"].actions.call),
                        onPress: () =>
                          void openContactAction(
                            `tel:${worker.phone_number}`,
                            t(($) => $["features/workers"].detail.phoneError)
                          )
                      }
                    : undefined
                }
                icon={PhoneIcon}
                label={t(($) => $["features/workers"].detail.phone)}
                value={
                  worker.phone_number ??
                  t(($) => $["features/workers"].detail.notProvided)
                }
              />
              <DetailRow
                action={
                  worker.email
                    ? {
                        label: t(($) => $["features/workers"].detail.email),
                        onPress: () =>
                          void openContactAction(
                            `mailto:${worker.email}`,
                            t(($) => $["features/workers"].detail.emailError)
                          )
                      }
                    : undefined
                }
                icon={MailIcon}
                label={t(($) => $["features/workers"].detail.email)}
                value={
                  worker.email ??
                  t(($) => $["features/workers"].detail.notProvided)
                }
              />
              {contactError ? (
                <AppText selectable tone="danger">
                  {contactError}
                </AppText>
              ) : null}
            </View>
          </AppCard>

          <AppCard padding="lg" style={{ flex: 1 }}>
            <View style={{ gap: atomSpacing[4] }}>
              <AppHeading variant="section">
                {t(($) => $["features/workers"].detail.relationships)}
              </AppHeading>
              <DetailRow
                action={
                  worker.contractor
                    ? {
                        label: t(($) => $["features/workers"].actions.open),
                        onPress: () =>
                          router.push(
                            `/contractors/${worker.contractor!.id}` as never
                          )
                      }
                    : undefined
                }
                icon={HardHatIcon}
                label={t(($) => $["features/workers"].detail.contractor)}
                value={
                  worker.contractor
                    ? getContractorDisplayName(worker.contractor)
                    : t(($) => $["features/workers"].detail.independent)
                }
              />
              <View style={{ gap: atomSpacing[2] }}>
                <AppText tone="subtle" variant="meta">
                  {t(($) => $["features/workers"].detail.tradeCategories)}
                </AppText>
                {worker.trade_categories.length > 0 ? (
                  worker.trade_categories.map((category) => (
                    <View key={category.id} style={styles.tradeChip}>
                      <AppText tone="accent" variant="bodySm">
                        {getTradeCategoryLabel(category.code, language)}
                      </AppText>
                    </View>
                  ))
                ) : (
                  <AppText tone="muted">
                    {t(($) => $["features/workers"].detail.noTrades)}
                  </AppText>
                )}
              </View>
            </View>
          </AppCard>
        </View>
      </View>

      <DestructiveConfirmationDialog
        accessibilityLabel={t(
          ($) => $["features/workers"].accessibility.cancelDelete
        )}
        confirmLabel={t(($) => $["features/workers"].actions.delete)}
        controller={deleteConfirmation}
        description={t(($) => $["features/workers"].delete.description)}
        isPending={deleteMutation.isPending}
        onConfirm={deleteWorker}
        title={t(($) => $["features/workers"].delete.title, {
          name: displayName
        })}
      />
    </Screen>
  );
}

function DetailRow({
  action,
  icon: Icon,
  label,
  value
}: {
  action?: { label: string; onPress: () => void };
  icon: AppIconComponent;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Icon color={atomPalette.accent} size="sm" />
      </View>
      <View style={{ flex: 1, gap: atomSpacing[1] }}>
        <AppText tone="subtle" variant="meta">
          {label.toLocaleUpperCase()}
        </AppText>
        <AppText selectable>{value}</AppText>
      </View>
      {action ? (
        <AppButton
          color="neutral"
          fullWidth={false}
          onPress={action.onPress}
          size="sm"
          variant="ghost"
        >
          {action.label}
        </AppButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: atomSpacing[3]
  },
  actionsCompact: {
    width: "100%"
  },
  avatar: {
    alignItems: "center",
    backgroundColor: `${atomPalette.accent}14`,
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  detailGrid: {
    gap: atomSpacing[5]
  },
  detailGridExpanded: {
    flexDirection: "row"
  },
  detailIcon: {
    alignItems: "center",
    backgroundColor: `${atomPalette.accent}10`,
    borderRadius: atomRadii.md,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: atomSpacing[3]
  },
  identityContent: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: atomSpacing[4]
  },
  identityLayout: {
    alignItems: "center",
    flexDirection: "row",
    gap: atomSpacing[5],
    justifyContent: "space-between"
  },
  identityLayoutCompact: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  page: {
    alignSelf: "center",
    gap: atomSpacing[6],
    maxWidth: 1120,
    width: "100%"
  },
  tradeChip: {
    alignSelf: "flex-start",
    backgroundColor: `${atomPalette.accent}10`,
    borderColor: `${atomPalette.accent}24`,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: atomSpacing[3],
    paddingVertical: atomSpacing[2]
  }
});
