import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import type { AppIconComponent } from "@/shared/ui/icons";
import type { ReactNode } from "react";
import { View } from "react-native";

export function EmptyState({
  action,
  description,
  icon,
  title
}: {
  action?: {
    icon?: AppIconComponent;
    label: string;
    onPress: () => void;
  };
  description: ReactNode;
  icon?: AppIconComponent;
  title: ReactNode;
}) {
  const Icon = icon;

  return (
    <AppCard padding="lg" tone="muted">
      <View style={{ alignItems: "center", gap: atomSpacing[4] }}>
        {Icon ? (
          <Icon color="currentColor" size={24} strokeWidth={1.8} />
        ) : null}
        <View style={{ alignItems: "center", gap: atomSpacing[2] }}>
          <AppHeading style={{ textAlign: "center" }} variant="card">
            {title}
          </AppHeading>
          <AppText style={{ textAlign: "center" }} tone="muted">
            {description}
          </AppText>
        </View>
        {action ? (
          <AppButton
            fullWidth={false}
            icon={action.icon}
            onPress={action.onPress}
            size="sm"
          >
            {action.label}
          </AppButton>
        ) : null}
      </View>
    </AppCard>
  );
}
