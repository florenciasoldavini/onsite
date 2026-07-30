import ProjectDocumentUploadScreen from "@/features/documents/screens/project-document-upload-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function ProjectDocumentUploadRoute() {
  const params = useLocalSearchParams<{ projectId: string | string[] }>();
  const projectId = parseRequiredUuidRouteParam(params.projectId);
  return <ProjectDocumentUploadScreen projectId={projectId ?? undefined} />;
}
