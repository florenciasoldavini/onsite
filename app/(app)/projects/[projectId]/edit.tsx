import { RouteLoadingScreen } from "@/shared/route-loading-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";
import { lazy, Suspense } from "react";

const ProjectFormScreen = lazy(async () => {
  const module = await import(
    "@/features/projects/screens/project-form-screen"
  );
  return { default: module.ProjectFormScreen };
});

export default function EditProjectRoute() {
  const params = useLocalSearchParams<{ projectId: string | string[] }>();
  const projectId = parseRequiredUuidRouteParam(params.projectId);

  return (
    <Suspense fallback={<RouteLoadingScreen />}>
      <ProjectFormScreen mode="edit" projectId={projectId ?? undefined} />
    </Suspense>
  );
}
