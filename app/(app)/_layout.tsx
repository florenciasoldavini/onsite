import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AdaptiveSideNavigation } from "@/shared/ui/components/adaptive-app-navigation";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function AppLayout() {
  const { isCompact, isExpanded } = useLayoutMode();

  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      {!isCompact ? <AdaptiveSideNavigation expanded={isExpanded} /> : null}
      <View key="app-content" style={{ flex: 1, minWidth: 0 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="projects/new/index" />
          <Stack.Screen name="projects/[projectId]/index" />
          <Stack.Screen name="projects/[projectId]/edit" />
          <Stack.Screen name="clients/new/index" />
          <Stack.Screen name="clients/[clientId]/index" />
          <Stack.Screen name="clients/[clientId]/edit" />
        </Stack>
      </View>
    </View>
  );
}
