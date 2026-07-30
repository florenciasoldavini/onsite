import { getSupplierInitials } from "@/features/suppliers/schemas/supplier.schema";
import type { SupplierSummary } from "@/features/suppliers/types/supplier";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import {
  LinkIcon,
  MapPinIcon,
  type AppIconComponent
} from "@/shared/ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View, type ViewStyle } from "react-native";

export function SupplierCard({
  onPress,
  supplier
}: {
  onPress: () => void;
  supplier: SupplierSummary;
}) {
  const { t } = useTranslation("features/suppliers");
  const [isHovered, setIsHovered] = useState(false);
  const isWebHovered = process.env.EXPO_OS === "web" && isHovered;

  return (
    <Pressable
      accessibilityLabel={t(
        ($) => $["features/suppliers"].accessibility.openSupplier,
        { name: supplier.name }
      )}
      accessibilityRole="button"
      onHoverIn={() => {
        if (process.env.EXPO_OS === "web") setIsHovered(true);
      }}
      onHoverOut={() => {
        if (process.env.EXPO_OS === "web") setIsHovered(false);
      }}
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: pressed ? 0.84 : 1 },
        process.env.EXPO_OS === "web"
          ? ({ cursor: "pointer" } as ViewStyle)
          : null
      ]}
    >
      <AppCard
        style={{
          backgroundColor: isWebHovered
            ? atomPalette.surfaceRaised
            : atomPalette.surface,
          borderColor: isWebHovered
            ? atomPalette.border
            : atomPalette.borderSubtle
        }}
      >
        <View style={{ gap: atomSpacing[4] }}>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: atomSpacing[3]
            }}
          >
            <View
              style={{
                alignItems: "center",
                backgroundColor: `${atomPalette.accent}14`,
                borderRadius: 999,
                height: 42,
                justifyContent: "center",
                width: 42
              }}
            >
              <AppText tone="accent" variant="label">
                {getSupplierInitials(supplier.name)}
              </AppText>
            </View>
            <View style={{ flex: 1, gap: atomSpacing[1] }}>
              <AppHeading numberOfLines={1} variant="card">
                {supplier.name}
              </AppHeading>
              {supplier.contact_name ? (
                <AppText numberOfLines={1} tone="muted" variant="bodySm">
                  {supplier.contact_name}
                </AppText>
              ) : null}
            </View>
          </View>
          <InfoLine
            icon={MapPinIcon}
            text={
              supplier.address ??
              t(($) => $["features/suppliers"].detail.noAddress)
            }
          />
          <InfoLine
            icon={LinkIcon}
            text={
              supplier.website_url ??
              t(($) => $["features/suppliers"].detail.noWebsite)
            }
          />
        </View>
      </AppCard>
    </Pressable>
  );
}

function InfoLine({
  icon: Icon,
  text
}: {
  icon: AppIconComponent;
  text: string;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        flexDirection: "row",
        gap: atomSpacing[2]
      }}
    >
      <Icon color={atomPalette.textMuted} size="sm" />
      <AppText numberOfLines={1} style={{ flex: 1 }} tone="muted">
        {text}
      </AppText>
    </View>
  );
}
