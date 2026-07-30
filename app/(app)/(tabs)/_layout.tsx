import { HapticTab } from "@/shared/ui/haptic-tab";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import {
  ProfileIcon,
  ProjectsIcon,
  ToDoIcon,
  UserIcon
} from "@/shared/ui/icons";
import { getMonoFontStyle } from "@/shared/theme/fonts";
import { designTokens } from "@/shared/theme/tokens";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation("features/localization");
  const { isCompact } = useLayoutMode();
  const tabLabelToken = designTokens.typeScale.tabLabelMono;
  const tabIconSize = "md" as const;
  const nativeLabelSize = 10;
  const nativeLetterSpacing = 0.35;
  const nativeTabBarHeight = 78;
  const isWeb = process.env.EXPO_OS === "web";

  return (
    <Tabs
      tabBar={(props) => (isCompact ? <BottomTabBar {...props} /> : null)}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: designTokens.colors.semantic.text.accent,
        tabBarInactiveTintColor: designTokens.colors.semantic.text.muted,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: {
          backgroundColor: designTokens.colors.semantic.bg.canvas,
          borderTopColor: designTokens.colors.semantic.border.subtle,
          height: isWeb ? 64 : nativeTabBarHeight,
          paddingBottom: isWeb ? 8 : 14,
          paddingTop: 6
        },
        tabBarPosition: isCompact ? "bottom" : "left",
        tabBarItemStyle: {
          gap: 2,
          minWidth: 0,
          paddingTop: isWeb ? 0 : 2
        },
        tabBarIconStyle: {
          marginBottom: 0
        },
        tabBarButton: (props) => <HapticTab {...props} />,
        tabBarLabelStyle: {
          fontSize: isWeb ? tabLabelToken.fontSize : nativeLabelSize,
          lineHeight: 14,
          letterSpacing: isWeb
            ? tabLabelToken.letterSpacing
            : nativeLetterSpacing,
          textTransform: tabLabelToken.textTransform,
          ...getMonoFontStyle(tabLabelToken.fontWeight)
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: t(($) => $["features/localization"].navigation.projects),
          tabBarIcon: ({ color }) => (
            <ProjectsIcon color={color} size={tabIconSize} />
          )
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: t(($) => $["features/localization"].navigation.directory),
          tabBarIcon: ({ color }) => (
            <UserIcon color={color} size={tabIconSize} />
          )
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t(($) => $["features/localization"].navigation.tasks),
          tabBarIcon: ({ color }) => (
            <ToDoIcon color={color} size={tabIconSize} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t(($) => $["features/localization"].navigation.profile),
          tabBarIcon: ({ color }) => (
            <ProfileIcon color={color} size={tabIconSize} />
          )
        }}
      />
    </Tabs>
  );
}
