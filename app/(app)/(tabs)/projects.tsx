import { RouteLoadingScreen } from "@/shared/route-loading-screen";
import { lazy, Suspense } from "react";

const ProjectsScreen = lazy(
  () => import("@/features/projects/screens/projects-screen")
);

export default function ProjectsRoute() {
  return (
    <Suspense fallback={<RouteLoadingScreen />}>
      <ProjectsScreen />
    </Suspense>
  );
}
