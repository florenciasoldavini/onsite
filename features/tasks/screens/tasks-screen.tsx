import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { Screen } from "@/shared/ui/components/screen";
import { AppText } from "@/shared/ui/components/text";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { atomSpacing } from "@/shared/ui/components/theme";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

export default function TasksScreen() {
  const { isExpanded } = useLayoutMode();
  const { t } = useTranslation("features/tasks");

  return (
    <Screen>
      <View
        style={{
          alignSelf: isExpanded ? "center" : undefined,
          gap: atomSpacing[6],
          maxWidth: isExpanded ? 1040 : undefined,
          width: "100%"
        }}
      >
        <NavScreenHeader title={t(($) => $["features/tasks"].title)} />

        <AppCard
          padding="lg"
          style={{ maxWidth: isExpanded ? 760 : undefined }}
        >
          <View style={{ gap: atomSpacing[3] }}>
            <AppHeading variant="section">
              {t(($) => $["features/tasks"].heading)}
            </AppHeading>
            <AppText tone="muted">
              {t(($) => $["features/tasks"].description)}
            </AppText>
          </View>
        </AppCard>
      </View>
    </Screen>
  );
}
