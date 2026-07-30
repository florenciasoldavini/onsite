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
import { useTranslation } from "react-i18next";
import { Linking, Pressable, StyleSheet, View } from "react-native";

export function SupplierDetailContent({ supplier }: { supplier: Supplier }) {
  const router = useRouter();
  const { t } = useTranslation("features/suppliers");
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
        description: t(
          ($) => $["features/suppliers"].detail.deletedDescription,
          { name: supplier.name }
        ),
        title: t(($) => $["features/suppliers"].detail.deletedTitle),
        tone: "success"
      });
      router.replace("/directory?section=suppliers" as never);
    } catch (error) {
      deleteConfirmation.setError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/suppliers"].errors.delete)
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
              label: t(($) => $["features/suppliers"].breadcrumbs.suppliers),
              onPress: () =>
                router.replace("/directory?section=suppliers" as never)
            },
            {
              label: t(($) => $["features/suppliers"].breadcrumbs.detail)
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
                  {getSupplierInitials(supplier.name)}
                </AppText>
              </View>
              <View style={{ flex: 1, gap: atomSpacing[2] }}>
                <AppText tone="accent" variant="eyebrow">
                  {t(($) => $["features/suppliers"].detail.profile)}
                </AppText>
                <AppHeading variant="hero">{supplier.name}</AppHeading>
                <AppText tone="muted">
                  {t(
                    ($) =>
                      $["features/suppliers"].detail.profileDescription
                  )}
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
                {t(($) => $["features/suppliers"].actions.edit)}
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
                {t(($) => $["features/suppliers"].actions.deleteShort)}
              </AppButton>
            </View>
          </View>
        </AppCard>

        <AppCard padding="lg">
          <View style={{ gap: atomSpacing[4] }}>
            <AppHeading variant="section">
              {t(($) => $["features/suppliers"].detail.contactDetails)}
            </AppHeading>
            <DetailRow
              icon={UserIcon}
              label={t(($) => $["features/suppliers"].detail.contact)}
              value={
                supplier.contact_name ??
                t(($) => $["features/suppliers"].detail.notProvided)
              }
            />
            <DetailRow
              action={
                supplier.phone_number
                  ? {
                      label: t(($) => $["features/suppliers"].actions.call),
                      onPress: () =>
                        void openAction(
                          `tel:${supplier.phone_number}`,
                          t(($) => $["features/suppliers"].errors.phoneApp)
                        )
                    }
                  : undefined
              }
              icon={PhoneIcon}
              label={t(($) => $["features/suppliers"].detail.phone)}
              value={
                supplier.phone_number ??
                t(($) => $["features/suppliers"].detail.notProvided)
              }
            />
            <DetailRow
              action={
                supplier.email
                  ? {
                      label: t(($) => $["features/suppliers"].actions.email),
                      onPress: () =>
                        void openAction(
                          `mailto:${supplier.email}`,
                          t(($) => $["features/suppliers"].errors.emailApp)
                        )
                    }
                  : undefined
              }
              icon={MailIcon}
              label={t(($) => $["features/suppliers"].detail.email)}
              value={
                supplier.email ??
                t(($) => $["features/suppliers"].detail.notProvided)
              }
            />
            <DetailRow
              action={
                supplier.website_url
                  ? {
                      label: t(($) => $["features/suppliers"].actions.open),
                      onPress: () =>
                        void openAction(
                          supplier.website_url!,
                          t(($) => $["features/suppliers"].errors.website)
                        )
                    }
                  : undefined
              }
              icon={LinkIcon}
              label={t(($) => $["features/suppliers"].detail.website)}
              value={
                supplier.website_url ??
                t(($) => $["features/suppliers"].detail.notProvided)
              }
            />
            <DetailRow
              action={
                supplier.address &&
                supplier.latitude !== null &&
                supplier.longitude !== null
                  ? {
                      label: t(
                        ($) => $["features/suppliers"].actions.openMaps
                      ),
                      onPress: () =>
                        void openAction(
                          getMapsUrl(supplier),
                          t(($) => $["features/suppliers"].errors.mapApp)
                        )
                    }
                  : undefined
              }
              icon={MapPinIcon}
              label={t(($) => $["features/suppliers"].detail.address)}
              value={
                supplier.address ??
                t(($) => $["features/suppliers"].detail.notProvided)
              }
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
              <AppHeading variant="section">
                {t(($) => $["features/suppliers"].detail.location)}
              </AppHeading>
              {mapPreview.isLoading ? <SkeletonBlock height={260} /> : null}
              {mapPreview.isError ? (
                <FieldMessage tone="error">
                  {getUserFacingErrorMessage(
                    mapPreview.error,
                    t(($) => $["features/suppliers"].errors.mapPreview)
                  )}
                </FieldMessage>
              ) : null}
              {mapPreview.data ? (
                <Image
                  alt={t(
                    ($) => $["features/suppliers"].accessibility.mapShowing,
                    { address: supplier.address }
                  )}
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
              <AppHeading variant="section">
                {t(($) => $["features/suppliers"].detail.notes)}
              </AppHeading>
              <AppText selectable>{supplier.notes}</AppText>
            </View>
          </AppCard>
        ) : null}
      </View>

      <DestructiveConfirmationDialog
        accessibilityLabel={t(
          ($) => $["features/suppliers"].accessibility.cancelDelete
        )}
        confirmLabel={t(($) => $["features/suppliers"].actions.delete)}
        controller={deleteConfirmation}
        description={t(($) => $["features/suppliers"].delete.description)}
        isPending={deleteMutation.isPending}
        onConfirm={deleteSupplier}
        title={t(($) => $["features/suppliers"].delete.title, {
          name: supplier.name
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
