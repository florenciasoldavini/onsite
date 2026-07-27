import {
  getContractorDisplayName,
  getContractorInitials
} from "@/features/contractors/schemas/contractor.schema";
import type { ContractorSummary } from "@/features/contractors/types/contractor";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import { MailIcon, PhoneIcon } from "@/shared/ui/icons";
import { useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";

export function ContractorCard({
  contractor,
  onPress
}: {
  contractor: ContractorSummary;
  onPress: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isWebHovered = process.env.EXPO_OS === "web" && isHovered;

  return (
    <Pressable
      accessibilityLabel={`Open ${getContractorDisplayName(contractor)}`}
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
              <AppText
                accessibilityLabel={`${getContractorDisplayName(contractor)} initials`}
                style={{ letterSpacing: 0.5 }}
                tone="accent"
                variant="label"
              >
                {getContractorInitials(contractor)}
              </AppText>
            </View>
            <AppHeading style={{ flex: 1 }} variant="card">
              {getContractorDisplayName(contractor)}
            </AppHeading>
          </View>
          <ContactLine
            icon={PhoneIcon}
            text={contractor.phone_number ?? "No phone number"}
          />
          <ContactLine
            icon={MailIcon}
            text={contractor.email ?? "No email address"}
          />
        </View>
      </AppCard>
    </Pressable>
  );
}

function ContactLine({
  icon: Icon,
  text
}: {
  icon: typeof PhoneIcon;
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
