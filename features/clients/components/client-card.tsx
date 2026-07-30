import {
  getClientDisplayName,
  getClientInitials
} from "@/features/clients/schemas/client.schema";
import type { ClientSummary } from "@/features/clients/types/client";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import { MailIcon, PhoneIcon } from "@/shared/ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, View, type ViewStyle } from "react-native";

export function ClientCard({
  client,
  onPress
}: {
  client: ClientSummary;
  onPress: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation("features/clients");
  const isWebHovered = Platform.OS === "web" && isHovered;

  return (
    <Pressable
      accessibilityLabel={t(
        ($) => $["features/clients"].accessibility.openClient,
        { name: getClientDisplayName(client) }
      )}
      accessibilityRole="button"
      onHoverIn={() => {
        if (Platform.OS === "web") {
          setIsHovered(true);
        }
      }}
      onHoverOut={() => {
        if (Platform.OS === "web") {
          setIsHovered(false);
        }
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
                accessibilityLabel={`${getClientDisplayName(client)} initials`}
                style={{ letterSpacing: 0.5 }}
                tone="accent"
                variant="label"
              >
                {getClientInitials(client)}
              </AppText>
            </View>
            <AppHeading style={{ flex: 1 }} variant="card">
              {getClientDisplayName(client)}
            </AppHeading>
          </View>
          <ContactLine
            icon={PhoneIcon}
            text={
              client.phone_number ??
              t(($) => $["features/clients"].list.noPhone)
            }
          />
          <ContactLine
            icon={MailIcon}
            text={
              client.email ?? t(($) => $["features/clients"].list.noEmail)
            }
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
