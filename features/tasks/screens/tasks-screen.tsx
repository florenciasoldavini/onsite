import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { Screen } from "@/shared/ui/components/screen";
import { AppText } from "@/shared/ui/components/text";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { atomSpacing } from "@/shared/ui/components/theme";
import { View } from "react-native";

export default function TasksScreen() {
  const { isExpanded } = useLayoutMode();

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
        <NavScreenHeader title="Tasks" />

        <AppCard
          padding="lg"
          style={{ maxWidth: isExpanded ? 760 : undefined }}
        >
          <View style={{ gap: atomSpacing[3] }}>
            <AppHeading variant="section">
              Task workspace coming next.
            </AppHeading>
            <AppText tone="muted">
              This placeholder now uses the shared design-system primitives, so
              future task UI can build on the same spacing, typography, and
              surface rules as the rest of the app.
            </AppText>
          </View>
        </AppCard>
      </View>
    </Screen>
  );
}
