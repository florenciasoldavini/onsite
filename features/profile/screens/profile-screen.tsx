import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  ProfileWorkspace,
  type ProfileTab
} from "@/features/profile/components/profile-workspace";
import type { SupportedOAuthProvider } from "@/features/auth/utils/auth-callback";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { useEffect, useState } from "react";

export default function ProfileScreen({
  returnedLinkProvider = null
}: {
  returnedLinkProvider?: SupportedOAuthProvider | null;
}) {
  const { logOut, session, user } = useAuth();
  const { isExpanded } = useLayoutMode();
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  useEffect(() => {
    if (returnedLinkProvider) {
      setActiveTab("methods");
    }
  }, [returnedLinkProvider]);

  return (
    <ProfileWorkspace
      activeTab={activeTab}
      email={user?.email ?? session?.user.email}
      isExpanded={isExpanded}
      onChangeTab={setActiveTab}
      onLogout={() => void logOut()}
      returnedLinkProvider={returnedLinkProvider}
    />
  );
}
