import { RouteLoadingScreen } from "@/shared/route-loading-screen";
import { firstRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";
import { lazy, Suspense } from "react";

const DirectoryScreen = lazy(
  () => import("@/features/directory/screens/directory-screen")
);

export default function DirectoryRoute() {
  const params = useLocalSearchParams<{
    section?: string | string[];
  }>();
  const requestedSection = firstRouteParam(params.section);

  return (
    <Suspense fallback={<RouteLoadingScreen />}>
      <DirectoryScreen requestedSection={requestedSection} />
    </Suspense>
  );
}
