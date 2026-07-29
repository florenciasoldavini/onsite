import ProjectPhotoUploadScreen from "@/features/photos/screens/project-photo-upload-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function ProjectPhotoUploadRoute() {
  const params = useLocalSearchParams<{ projectId: string | string[] }>();
  const projectId = parseRequiredUuidRouteParam(params.projectId);

  return <ProjectPhotoUploadScreen projectId={projectId ?? undefined} />;
}
