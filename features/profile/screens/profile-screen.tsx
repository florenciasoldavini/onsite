import { authCardMaxWidth } from "@/features/auth/components/auth-shell";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSupportedOAuthProvider } from "@/features/auth/utils/auth-callback";
import { ProfileIdentityMethodsTab } from "@/features/profile/components/profile-identity-methods-tab";
import { ProfileInfoTab } from "@/features/profile/components/profile-info-tab";
import { ProfileSecurityTab } from "@/features/profile/components/profile-security-tab";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppButton } from "@/shared/ui/components/button";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { Screen } from "@/shared/ui/components/screen";
import { SegmentedTabs } from "@/shared/ui/components/tabs";
import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { LogoutIcon } from "@/shared/ui/icons";
import { useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type ProfileTab = "profile" | "security" | "methods";

const profileTabs = [
  { value: "profile", label: "Profile" },
  { value: "security", label: "Security" },
  { value: "methods", label: "Sign-In" }
] satisfies { value: ProfileTab; label: string }[];

export default function ProfileScreen() {
  const { logOut, session, user } = useAuth();
  const { isExpanded } = useLayoutMode();
  const { identity_link_check: identityLinkCheckParam } = useLocalSearchParams<{
    identity_link_check?: string | string[];
  }>();
  const returnedLinkProvider = getSupportedOAuthProvider(
    identityLinkCheckParam
  );
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  useEffect(() => {
    if (returnedLinkProvider) {
      setActiveTab("methods");
    }
  }, [returnedLinkProvider]);

  return (
    <Screen>
      <View
        style={[
          styles.page,
          { maxWidth: isExpanded ? 1040 : authCardMaxWidth }
        ]}
      >
        <NavScreenHeader
          description={user?.email ?? session?.user.email}
          title="Profile"
        />

        <View
          style={[
            styles.workspace,
            isExpanded ? styles.workspaceExpanded : null
          ]}
        >
          {isExpanded ? (
            <View style={styles.sectionSidebar}>
              <ProfileSectionNavigation
                activeTab={activeTab}
                onChange={setActiveTab}
              />
              <LogoutButton onPress={() => void logOut()} size="sm" />
            </View>
          ) : (
            <SegmentedTabs
              onChange={setActiveTab}
              options={profileTabs}
              value={activeTab}
            />
          )}

          <View style={styles.sectionContent}>
            <ProfileTabPanel active={activeTab === "profile"}>
              <ProfileInfoTab />
            </ProfileTabPanel>
            <ProfileTabPanel active={activeTab === "security"}>
              <ProfileSecurityTab />
            </ProfileTabPanel>
            <ProfileTabPanel active={activeTab === "methods"}>
              <ProfileIdentityMethodsTab
                returnedLinkProvider={returnedLinkProvider}
              />
            </ProfileTabPanel>
          </View>
        </View>

        {!isExpanded ? (
          <LogoutButton onPress={() => void logOut()} size="md" />
        ) : null}
      </View>
    </Screen>
  );
}

function ProfileSectionNavigation({
  activeTab,
  onChange
}: {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}) {
  return (
    <View accessibilityRole="tablist" style={styles.navigation}>
      {profileTabs.map((tab) => {
        const selected = tab.value === activeTab;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.value}
            onPress={() => onChange(tab.value)}
            style={({ pressed }) => [
              styles.navigationItem,
              selected ? styles.navigationItemSelected : null,
              pressed ? styles.navigationItemPressed : null
            ]}
          >
            <AppText tone={selected ? "accent" : "muted"} variant="label">
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function ProfileTabPanel({
  active,
  children
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <View
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
      style={active ? null : styles.hidden}
    >
      {children}
    </View>
  );
}

function LogoutButton({
  onPress,
  size
}: {
  onPress: () => void;
  size: "md" | "sm";
}) {
  return (
    <AppButton
      color="danger"
      icon={LogoutIcon}
      iconAfter={false}
      onPress={onPress}
      size={size}
      variant="bordered"
    >
      Log Out
    </AppButton>
  );
}

const styles = StyleSheet.create({
  hidden: {
    display: "none"
  },
  navigation: {
    gap: atomSpacing[2]
  },
  navigationItem: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: atomRadii.md,
    borderWidth: 1,
    paddingHorizontal: atomSpacing[4],
    paddingVertical: atomSpacing[3]
  },
  navigationItemPressed: {
    opacity: 0.72
  },
  navigationItemSelected: {
    backgroundColor: `${atomPalette.accent}14`,
    borderColor: `${atomPalette.accent}3D`
  },
  page: {
    alignSelf: "center",
    gap: atomSpacing[5],
    width: "100%"
  },
  sectionContent: {
    flex: 1,
    gap: atomSpacing[5],
    minWidth: 0
  },
  sectionSidebar: {
    gap: atomSpacing[4],
    justifyContent: "space-between",
    width: 224
  },
  workspace: {
    gap: atomSpacing[5]
  },
  workspaceExpanded: {
    alignItems: "flex-start",
    flexDirection: "row"
  }
});
