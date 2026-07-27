import { RouteLoadingScreen } from "@/shared/route-loading-screen";
import { lazy, Suspense } from "react";

const DirectoryScreen = lazy(
  () => import("@/features/directory/screens/directory-screen")
);

export default function Directory() {
  return (
    <Suspense fallback={<RouteLoadingScreen />}>
      <DirectoryScreen />
    </Suspense>
  );
}
