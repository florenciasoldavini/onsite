import {
  useSoftDeleteSupplier,
  useSupplier
} from "@/features/suppliers/hooks/use-suppliers";
import { useLocationMapPreview } from "@/features/locations/hooks/use-location-address";
import { getSupplierInitials } from "@/features/suppliers/schemas/supplier.schema";
import type { Supplier } from "@/features/suppliers/types/supplier";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppCard } from "@/shared/ui/components/card";
import {
  DestructiveConfirmationDialog,
  useDestructiveConfirmation
} from "@/shared/ui/components/destructive-confirmation-dialog";
import { FieldMessage } from "@/shared/ui/components/field-message";
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
  LinkIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  RefreshIcon,
  StoreIcon,
  TrashIcon,
  UserIcon,
  type AppIconComponent
} from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";

export function SupplierDetailContent({ supplier }: { supplier: Supplier }) {
  const router = useRouter();
  const toast = useAppToast();
  const { isCompact } = useLayoutMode();
  const deleteMutation = useSoftDeleteSupplier();
  const mapPreview = useLocationMapPreview({
    latitude: supplier.latitude,
    longitude: supplier.longitude
  });
  const deleteConfirmation = useDestructiveConfirmation();
  const [actionError, setActionError] = useState<string | null>(null);

  const openAction = async (url: string, fallback: string) => {
    setActionError(null);
    try {
      await Linking.openURL(url);
    } catch {
      setActionError(fallback);
    }
  };

  const deleteSupplier = async () => {
    deleteConfirmation.clearError();
    try {
      await deleteMutation.mutateAsync(supplier.id);
      deleteConfirmation.close();
      toast.show({
        description: `${supplier.name} was removed from your supplier catalog.`,
        title: "Supplier deleted",
        tone: "success"
      });
      router.replace("/directory?section=suppliers" as never);
    } catch (error) {
      deleteConfirmation.setError(
        getUserFacingErrorMessage(
          error,
          "We couldn't delete this supplier. Try again."
        )
      );
    }
  };

  return (
    <Screen>
      <View style={styles.page}>
        <Breadcrumb
          items={[
            {
              label: "Suppliers",
              onPress: () =>
                router.replace("/directory?section=suppliers" as never)
            },
            { label: "Supplier Detail" }
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
                  {getSupplierInitials(supplier.name)}
                </AppText>
              </View>
              <View style={{ flex: 1, gap: atomSpacing[2] }}>
                <AppText tone="accent" variant="eyebrow">
                  SUPPLIER PROFILE
                </AppText>
                <AppHeading variant="hero">{supplier.name}</AppHeading>
                <AppText tone="muted">
                  Business record in your supplier catalog
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
                  router.push(`/suppliers/${supplier.id}/edit` as never)
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
            <AppHeading variant="section">Contact details</AppHeading>
            <DetailRow
              icon={UserIcon}
              label="Contact"
              value={supplier.contact_name ?? "Not provided"}
            />
            <DetailRow
              action={
                supplier.phone_number
                  ? {
                      label: "Call",
                      onPress: () =>
                        void openAction(
                          `tel:${supplier.phone_number}`,
                          "We couldn't open your phone app. Copy the number and try it there."
                        )
                    }
                  : undefined
              }
              icon={PhoneIcon}
              label="Phone"
              value={supplier.phone_number ?? "Not provided"}
            />
            <DetailRow
              action={
                supplier.email
                  ? {
                      label: "Email",
                      onPress: () =>
                        void openAction(
                          `mailto:${supplier.email}`,
                          "We couldn't open your email app. Copy the address and try it there."
                        )
                    }
                  : undefined
              }
              icon={MailIcon}
              label="Email"
              value={supplier.email ?? "Not provided"}
            />
            <DetailRow
              action={
                supplier.website_url
                  ? {
                      label: "Open",
                      onPress: () =>
                        void openAction(
                          supplier.website_url!,
                          "We couldn't open this website. Copy the address and try it in your browser."
                        )
                    }
                  : undefined
              }
              icon={LinkIcon}
              label="Website"
              value={supplier.website_url ?? "Not provided"}
            />
            <DetailRow
              action={
                supplier.address &&
                supplier.latitude !== null &&
                supplier.longitude !== null
                  ? {
                      label: "Open in Maps",
                      onPress: () =>
                        void openAction(
                          getMapsUrl(supplier),
                          "We couldn't open your maps app. Copy the address and try it there."
                        )
                    }
                  : undefined
              }
              icon={MapPinIcon}
              label="Address"
              value={supplier.address ?? "Not provided"}
            />
            {actionError ? (
              <AppText selectable tone="danger">
                {actionError}
              </AppText>
            ) : null}
          </View>
        </AppCard>

        {supplier.address ? (
          <AppCard padding="lg">
            <View style={{ gap: atomSpacing[4] }}>
              <AppHeading variant="section">Location</AppHeading>
              {mapPreview.isLoading ? <SkeletonBlock height={260} /> : null}
              {mapPreview.isError ? (
                <FieldMessage tone="error">
                  {getUserFacingErrorMessage(
                    mapPreview.error,
                    "Map preview is unavailable right now. Try again shortly."
                  )}
                </FieldMessage>
              ) : null}
              {mapPreview.data ? (
                <Image
                  alt={`Map showing ${supplier.address}`}
                  contentFit="cover"
                  source={{ uri: mapPreview.data.imageDataUrl }}
                  style={styles.map}
                />
              ) : null}
            </View>
          </AppCard>
        ) : null}

        {supplier.notes ? (
          <AppCard padding="lg">
            <View style={{ gap: atomSpacing[3] }}>
              <AppHeading variant="section">Notes</AppHeading>
              <AppText selectable>{supplier.notes}</AppText>
            </View>
          </AppCard>
        ) : null}
      </View>

      <DestructiveConfirmationDialog
        accessibilityLabel="Cancel deleting supplier"
        confirmLabel="Delete supplier"
        controller={deleteConfirmation}
        description="This removes the supplier from your active catalog. This action cannot be undone."
        isPending={deleteMutation.isPending}
        onConfirm={deleteSupplier}
        title={`Delete ${supplier.name}?`}
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
      <Icon color={atomPalette.textMuted} size="md" />
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

function getMapsUrl(supplier: Supplier) {
  const latitude = supplier.latitude!;
  const longitude = supplier.longitude!;
  const label = encodeURIComponent(supplier.name);

  if (process.env.EXPO_OS === "ios") {
    return `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`;
  }

  if (process.env.EXPO_OS === "android") {
    return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
  }

  const place = supplier.google_place_id
    ? `&query_place_id=${encodeURIComponent(supplier.google_place_id)}`
    : "";
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}${place}`;
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
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: atomSpacing[3],
    minHeight: 52
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
  map: {
    backgroundColor: atomPalette.surfaceLow,
    borderRadius: atomRadii.lg,
    height: 260,
    width: "100%"
  },
  page: {
    alignSelf: "center",
    gap: atomSpacing[6],
    maxWidth: 980,
    width: "100%"
  }
});
