import { Screen } from "@/shared/ui/components/screen";
import { AppText } from "@/shared/ui/components/text";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import { ActivityIndicator, View } from "react-native";
import { useTranslation } from "react-i18next";

export function RouteLoadingScreen() {
  const { t } = useTranslation("shared");

  return (
    <Screen centered scrollable={false}>
      <View
        accessibilityLabel={t(($) => $.shared.accessibility.loadingScreen)}
        accessibilityRole="progressbar"
        style={{ alignItems: "center", gap: atomSpacing[3] }}
      >
        <ActivityIndicator color={atomPalette.accent} size="large" />
        <AppText tone="muted">{t(($) => $.shared.feedback.loading)}</AppText>
      </View>
    </Screen>
  );
}
