import { getContractorDisplayName } from "@/features/contractors/schemas/contractor.schema";
import { getTradeCategoryLabel } from "@/features/trade-categories/constants/trade-category-labels";
import {
  getWorkerDisplayName,
  getWorkerInitials
} from "@/features/workers/schemas/worker.schema";
import type { WorkerSummary } from "@/features/workers/types/worker";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import { HardHatIcon } from "@/shared/ui/icons";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, View, type ViewStyle } from "react-native";

export function WorkerCard({
  onPress,
  worker
}: {
  onPress: () => void;
  worker: WorkerSummary;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation("features/workers");
  const { language } = useLocalization();
  const isWebHovered = Platform.OS === "web" && isHovered;

  return (
    <Pressable
      accessibilityLabel={t(
        ($) => $["features/workers"].accessibility.open,
        { name: getWorkerDisplayName(worker) }
      )}
      accessibilityRole="button"
      onHoverIn={() => {
        if (Platform.OS === "web") setIsHovered(true);
      }}
      onHoverOut={() => {
        if (Platform.OS === "web") setIsHovered(false);
      }}
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: pressed ? 0.84 : 1 },
        Platform.OS === "web" ? ({ cursor: "pointer" } as ViewStyle) : null
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
        <View style={{ gap: atomSpacing[3] }}>
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
                {getWorkerInitials(worker)}
              </AppText>
            </View>
            <AppHeading style={{ flex: 1 }} variant="card">
              {getWorkerDisplayName(worker)}
            </AppHeading>
          </View>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: atomSpacing[2]
            }}
          >
            <HardHatIcon color={atomPalette.textMuted} size="sm" />
            <AppText numberOfLines={1} style={{ flex: 1 }} tone="muted">
              {worker.contractor
                ? getContractorDisplayName(worker.contractor)
                : t(($) => $["features/workers"].list.independent)}
            </AppText>
          </View>
          <AppText numberOfLines={2} tone="muted" variant="bodySm">
            {worker.trade_categories.length > 0
              ? worker.trade_categories
                  .map((category) =>
                    getTradeCategoryLabel(category.code, language)
                  )
                  .join(" · ")
              : t(($) => $["features/workers"].list.noTrades)}
          </AppText>
        </View>
      </AppCard>
    </Pressable>
  );
}
