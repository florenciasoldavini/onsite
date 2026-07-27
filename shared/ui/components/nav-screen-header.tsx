import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

export function NavScreenHeader({
  action,
  breadcrumbLabel,
  description,
  showBreadcrumb = true,
  style,
  title
}: {
  action?: ReactNode;
  breadcrumbLabel?: ReactNode;
  description?: ReactNode;
  showBreadcrumb?: boolean;
  style?: StyleProp<ViewStyle>;
  title: ReactNode;
}) {
  return (
    <View style={[{ gap: atomSpacing[3] }, style]}>
      {showBreadcrumb ? (
        <Breadcrumb
          items={[{ label: breadcrumbLabel ?? title }]}
          showTrailingSeparator
        />
      ) : null}
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          gap: atomSpacing[4],
          justifyContent: "space-between"
        }}
      >
        <AppHeading style={{ flex: 1 }} variant="hero">
          {title}
        </AppHeading>
        {action}
      </View>
      {typeof description === "string" ? (
        <AppText tone="muted">{description}</AppText>
      ) : (
        description
      )}
    </View>
  );
}
