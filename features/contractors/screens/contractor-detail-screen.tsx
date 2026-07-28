import {
  useContractor,
  useSoftDeleteContractor
} from "@/features/contractors/hooks/use-contractors";
import {
  getContractorDisplayName,
  getContractorInitials
} from "@/features/contractors/schemas/contractor.schema";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppCard } from "@/shared/ui/components/card";
import {
  DestructiveConfirmationDialog,
  useDestructiveConfirmation
} from "@/shared/ui/components/destructive-confirmation-dialog";
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
  TrashIcon
} from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  View
} from "react-native";

export default function ContractorDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contractorId: string }>();
  const contractorId = Array.isArray(params.contractorId)
    ? params.contractorId[0]
    : params.contractorId;
  const contractorQuery = useContractor(contractorId);

  if (contractorQuery.isLoading) {
    return (
      <Screen>
        <View style={{ gap: atomSpacing[5] }}>
          <SkeletonBlock height={48} width="55%" />
          <SkeletonBlock height={300} />
        </View>
      </Screen>
    );
  }

  if (contractorQuery.isError) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void contractorQuery.refetch()
          }}
          description={getUserFacingErrorMessage(
            contractorQuery.error,
            "We couldn't load this contractor. Try again."
          )}
          icon={HardHatIcon}
          title="Contractor unavailable"
        />
      </Screen>
    );
  }

  if (!contractorQuery.data) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            label: "Back to directory",
            onPress: () =>
              router.replace("/directory?section=contractors" as never)
          }}
          description="This contractor may have been removed or you may not have access."
          icon={HardHatIcon}
          title="Contractor not found"
        />
      </Screen>
    );
  }

  return <ContractorDetailContent contractor={contractorQuery.data} />;
}

function ContractorDetailContent({
  contractor
}: {
  contractor: NonNullable<ReturnType<typeof useContractor>["data"]>;
}) {
  const router = useRouter();
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
        description: `${displayName} was removed from your contractor catalog.`,
        title: "Contractor deleted",
        tone: "success"
      });
      router.replace("/directory?section=contractors" as never);
    } catch (error) {
      deleteConfirmation.setError(
        getUserFacingErrorMessage(
          error,
          "We couldn't delete this contractor. Try again."
        )
      );
    }
  };

  const openContactAction = async (
    url: string,
    fallbackMessage: string
  ) => {
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
              accessibilityLabel: "Back to contractor directory",
              label: "Contractors",
              onPress: () =>
                router.replace("/directory?section=contractors" as never)
            },
            { label: "Contractor Detail" }
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
                  CONTRACTOR PROFILE
                </AppText>
                <AppHeading variant="hero">{displayName}</AppHeading>
                <AppText tone="muted">
                  Contact record for your contractor catalog
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
                Edit
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
                Delete
              </AppButton>
            </View>
          </View>
        </AppCard>

        <AppCard padding="lg">
          <View style={{ gap: atomSpacing[4] }}>
            <View style={styles.sectionHeading}>
              <AppHeading variant="section">Contact details</AppHeading>
              <AppText tone="subtle" variant="meta">
                PRIMARY
              </AppText>
            </View>
            <ContactRow
              action={
                contractor.phone_number
                  ? {
                      label: "Call",
                      onPress: () =>
                        void openContactAction(
                          `tel:${contractor.phone_number}`,
                          "We couldn't open your phone app. Copy the number and try it there."
                        )
                    }
                  : undefined
              }
              icon={PhoneIcon}
              label="Phone"
              value={contractor.phone_number ?? "Not provided"}
            />
            <ContactRow
              action={
                contractor.email
                  ? {
                      label: "Email",
                      onPress: () =>
                        void openContactAction(
                          `mailto:${contractor.email}`,
                          "We couldn't open your email app. Copy the address and try it there."
                        )
                    }
                  : undefined
              }
              icon={MailIcon}
              label="Email"
              value={contractor.email ?? "Not provided"}
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
        accessibilityLabel="Cancel deleting contractor"
        confirmLabel="Delete contractor"
        controller={deleteConfirmation}
        description="This removes the contractor from your active catalog. This action cannot be undone."
        isPending={deleteMutation.isPending}
        onConfirm={deleteContractor}
        title={`Delete ${displayName}?`}
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
