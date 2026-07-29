import { getSupportedOAuthProvider } from "@/features/auth/utils/auth-callback";
import { RouteLoadingScreen } from "@/shared/route-loading-screen";
import { firstRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";
import { lazy, Suspense } from "react";

const ProfileScreen = lazy(
  () => import("@/features/profile/screens/profile-screen")
);

export default function ProfileRoute() {
  const params = useLocalSearchParams<{
    identity_link_check?: string | string[];
  }>();
  const returnedLinkProvider = getSupportedOAuthProvider(
    firstRouteParam(params.identity_link_check)
  );

  return (
    <Suspense fallback={<RouteLoadingScreen />}>
      <ProfileScreen returnedLinkProvider={returnedLinkProvider} />
    </Suspense>
  );
}
