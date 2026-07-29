import ProjectPhotoDetailScreen from "@/features/photos/screens/project-photo-detail-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function ProjectPhotoDetailRoute() {
  const params = useLocalSearchParams<{
    photoId: string | string[];
    projectId: string | string[];
  }>();
  const photoId = parseRequiredUuidRouteParam(params.photoId);
  const projectId = parseRequiredUuidRouteParam(params.projectId);

  return (
    <ProjectPhotoDetailScreen
      photoId={photoId ?? undefined}
      projectId={projectId ?? undefined}
    />
  );
}
