import { AppText } from "@/shared/ui/components/text";
import {
  atomLayout,
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import {
  HardHatIcon,
  ProfileIcon,
  ProjectsIcon,
  ToDoIcon,
  UserIcon,
  type AppIconComponent
} from "@/shared/ui/icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

const sideNavigationBackground = atomPalette.surface;
const sideNavigationBorder = atomPalette.borderSubtle;
const sideNavigationMuted = atomPalette.textMuted;

const primaryDestinations = [
  { href: "/projects", icon: ProjectsIcon, labelKey: "projects" },
  {
    activePrefixes: ["/clients", "/contractors"],
    href: "/directory",
    icon: UserIcon,
    labelKey: "directory"
  },
  { href: "/tasks", icon: ToDoIcon, labelKey: "tasks" }
] as const;

const accountDestination = {
  href: "/profile",
  icon: ProfileIcon,
  labelKey: "profile"
} as const;

export function AdaptiveSideNavigation({ expanded }: { expanded: boolean }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("features/localization");

  return (
    <View
      accessibilityLabel={t(
        ($) => $["features/localization"].navigation.primaryNavigation
      )}
      accessibilityRole="tablist"
      style={{
        backgroundColor: sideNavigationBackground,
        borderRightColor: sideNavigationBorder,
        borderRightWidth: 1,
        paddingBottom: Math.max(insets.bottom, atomSpacing[4]),
        paddingHorizontal: expanded ? atomSpacing[4] : atomSpacing[2],
        paddingTop: Math.max(insets.top, atomSpacing[5]),
        width: expanded
          ? atomLayout.navigationSidebarWidth
          : atomLayout.navigationRailWidth
      }}
    >
      <View
        style={{
          alignItems: "center",
          flexDirection: expanded ? "row" : "column",
          gap: atomSpacing[3],
          minHeight: 52,
          paddingHorizontal: expanded ? atomSpacing[3] : 0
        }}
      >
        <HardHatIcon color={atomPalette.accent} size="md" />
        {expanded ? (
          <AppText
            style={{ color: atomPalette.text, letterSpacing: 1.2 }}
            variant="label"
          >
            ONZAIT
          </AppText>
        ) : null}
      </View>

      <View style={{ gap: atomSpacing[2], paddingTop: atomSpacing[8] }}>
        {primaryDestinations.map((destination) => (
          <SideNavigationDestination
            destination={destination}
            expanded={expanded}
            key={destination.href}
          />
        ))}
      </View>

      <View
        style={{
          borderTopColor: sideNavigationBorder,
          borderTopWidth: 1,
          gap: atomSpacing[2],
          marginTop: "auto",
          paddingTop: atomSpacing[4]
        }}
      >
        <SideNavigationDestination
          destination={accountDestination}
          expanded={expanded}
        />
      </View>
    </View>
  );
}

function SideNavigationDestination({
  destination,
  expanded
}: {
  destination: {
    activePrefixes?: readonly string[];
    href: string;
    icon: AppIconComponent;
    labelKey: "directory" | "profile" | "projects" | "tasks";
  };
  expanded: boolean;
}) {
  const { t } = useTranslation("features/localization");
  const pathname = usePathname();
  const router = useRouter();
  const focused =
    pathname === destination.href ||
    pathname.startsWith(`${destination.href}/`) ||
    destination.activePrefixes?.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  const color = focused ? atomPalette.accent : sideNavigationMuted;
  const Icon = destination.icon;
  const label = t(
    ($) => $["features/localization"].navigation[destination.labelKey]
  );

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      onPress={() => router.navigate(destination.href as never)}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: focused ? `${atomPalette.accent}12` : "transparent",
        borderRadius: atomRadii.md,
        flexDirection: expanded ? "row" : "column",
        gap: expanded ? atomSpacing[3] : atomSpacing[1],
        justifyContent: expanded ? "flex-start" : "center",
        minHeight: expanded ? 48 : 58,
        opacity: pressed ? 0.72 : 1,
        paddingHorizontal: expanded ? atomSpacing[4] : atomSpacing[2],
        paddingVertical: atomSpacing[2]
      })}
    >
      <Icon color={color} size="md" />
      <AppText
        numberOfLines={1}
        style={{
          color,
          flex: expanded ? 1 : undefined,
          fontSize: expanded ? undefined : 9,
          lineHeight: expanded ? undefined : 12
        }}
        variant={expanded ? "label" : "meta"}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
