import ProjectPhotosScreen from "@/features/photos/screens/project-photos-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function ProjectPhotosRoute() {
  const params = useLocalSearchParams<{ projectId: string | string[] }>();
  const projectId = parseRequiredUuidRouteParam(params.projectId);

  return <ProjectPhotosScreen projectId={projectId ?? undefined} />;
}
