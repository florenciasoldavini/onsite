import { RouteLoadingScreen } from "@/shared/route-loading-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";
import { lazy, Suspense } from "react";

const ProjectDetailScreen = lazy(
  () => import("@/features/projects/screens/project-detail-screen")
);

export default function ProjectDetailRoute() {
  const params = useLocalSearchParams<{ projectId: string | string[] }>();
  const projectId = parseRequiredUuidRouteParam(params.projectId);

  return (
    <Suspense fallback={<RouteLoadingScreen />}>
      <ProjectDetailScreen projectId={projectId ?? undefined} />
    </Suspense>
  );
}
