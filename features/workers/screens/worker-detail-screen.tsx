import { getContractorDisplayName } from "@/features/contractors/schemas/contractor.schema";
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
import { EmptyState } from "@/shared/ui/components/empty-state";
import { AppHeading } from "@/shared/ui/components/heading";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Modal, Pressable, StyleSheet, View } from "react-native";

export default function WorkerDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ workerId: string }>();
  const workerId = Array.isArray(params.workerId)
    ? params.workerId[0]
    : params.workerId;
  const workerQuery = useWorker(workerId);

  if (workerQuery.isLoading) {
    return (
      <Screen>
        <View style={{ gap: atomSpacing[5] }}>
          <SkeletonBlock height={48} width="55%" />
          <SkeletonBlock height={320} />
        </View>
      </Screen>
    );
  }

  if (workerQuery.isError) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void workerQuery.refetch()
          }}
          description={getUserFacingErrorMessage(
            workerQuery.error,
            "We couldn't load this worker. Try again."
          )}
          icon={UserIcon}
          title="Worker unavailable"
        />
      </Screen>
    );
  }

  if (!workerQuery.data) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            label: "Back to directory",
            onPress: () => router.replace("/directory?section=workers" as never)
          }}
          description="This worker may have been removed or you may not have access."
          icon={UserIcon}
          title="Worker not found"
        />
      </Screen>
    );
  }

  return <WorkerDetailContent worker={workerQuery.data} />;
}

function WorkerDetailContent({
  worker
}: {
  worker: NonNullable<ReturnType<typeof useWorker>["data"]>;
}) {
  const router = useRouter();
  const { isCompact, isExpanded } = useLayoutMode();
  const toast = useAppToast();
  const deleteMutation = useSoftDeleteWorker();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const displayName = getWorkerDisplayName(worker);

  const deleteWorker = async () => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(worker.id);
      setDeleteOpen(false);
      toast.show({
        description: `${displayName} was removed from your worker catalog.`,
        title: "Worker deleted",
        tone: "success"
      });
      router.replace("/directory?section=workers" as never);
    } catch (error) {
      setDeleteError(
        getUserFacingErrorMessage(
          error,
          "We couldn't delete this worker. Try again."
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
              label: "Workers",
              onPress: () =>
                router.replace("/directory?section=workers" as never)
            },
            { label: "Worker Detail" }
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
                  WORKER PROFILE
                </AppText>
                <AppHeading variant="hero">{displayName}</AppHeading>
                <AppText tone="muted">
                  Contact and trade record for your worker catalog
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
                Edit
              </AppButton>
              <AppButton
                color="danger"
                fullWidth={isCompact}
                icon={TrashIcon}
                iconAfter={false}
                onPress={() => {
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
                size="sm"
                variant="bordered"
              >
                Delete
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
              <AppHeading variant="section">Contact details</AppHeading>
              <DetailRow
                action={
                  worker.phone_number
                    ? {
                        label: "Call",
                        onPress: () =>
                          void openContactAction(
                            `tel:${worker.phone_number}`,
                            "We couldn't open your phone app. Copy the number and try it there."
                          )
                      }
                    : undefined
                }
                icon={PhoneIcon}
                label="Phone"
                value={worker.phone_number ?? "Not provided"}
              />
              <DetailRow
                action={
                  worker.email
                    ? {
                        label: "Email",
                        onPress: () =>
                          void openContactAction(
                            `mailto:${worker.email}`,
                            "We couldn't open your email app. Copy the address and try it there."
                          )
                      }
                    : undefined
                }
                icon={MailIcon}
                label="Email"
                value={worker.email ?? "Not provided"}
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
              <AppHeading variant="section">Catalog relationships</AppHeading>
              <DetailRow
                action={
                  worker.contractor
                    ? {
                        label: "Open",
                        onPress: () =>
                          router.push(
                            `/contractors/${worker.contractor!.id}` as never
                          )
                      }
                    : undefined
                }
                icon={HardHatIcon}
                label="Contractor"
                value={
                  worker.contractor
                    ? getContractorDisplayName(worker.contractor)
                    : "Independent worker"
                }
              />
              <View style={{ gap: atomSpacing[2] }}>
                <AppText tone="subtle" variant="meta">
                  USUAL TRADES
                </AppText>
                {worker.trade_categories.length > 0 ? (
                  worker.trade_categories.map((category) => (
                    <View key={category.id} style={styles.tradeChip}>
                      <AppText tone="accent" variant="bodySm">
                        {getTradeCategoryLabel(category.code)}
                      </AppText>
                    </View>
                  ))
                ) : (
                  <AppText tone="muted">No trade categories selected</AppText>
                )}
              </View>
            </View>
          </AppCard>
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => {
          if (!deleteMutation.isPending) setDeleteOpen(false);
        }}
        transparent
        visible={deleteOpen}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Cancel deleting worker"
            onPress={() => {
              if (!deleteMutation.isPending) setDeleteOpen(false);
            }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.backdrop} />
          <AppCard padding="lg" style={styles.modalCard}>
            <View style={{ gap: atomSpacing[5] }}>
              <AppHeading variant="section">Delete {displayName}?</AppHeading>
              <AppText tone="muted">
                This removes the worker from your active catalog. This action
                cannot be undone.
              </AppText>
              {deleteError ? (
                <AppText selectable tone="danger">
                  {deleteError}
                </AppText>
              ) : null}
              <View style={styles.modalActions}>
                <AppButton
                  color="neutral"
                  fullWidth={false}
                  isDisabled={deleteMutation.isPending}
                  onPress={() => setDeleteOpen(false)}
                  variant="bordered"
                >
                  Cancel
                </AppButton>
                <AppButton
                  color="danger"
                  fullWidth={false}
                  loading={deleteMutation.isPending}
                  onPress={() => void deleteWorker()}
                >
                  Delete worker
                </AppButton>
              </View>
            </View>
          </AppCard>
        </View>
      </Modal>
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.42)"
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
  modalActions: {
    flexDirection: "row",
    gap: atomSpacing[3],
    justifyContent: "flex-end"
  },
  modalCard: {
    maxWidth: 520,
    width: "100%"
  },
  modalRoot: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: atomSpacing[4]
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
