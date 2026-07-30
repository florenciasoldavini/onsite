import ProjectDocumentsScreen from "@/features/documents/screens/project-documents-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function ProjectDocumentsRoute() {
  const params = useLocalSearchParams<{ projectId: string | string[] }>();
  const projectId = parseRequiredUuidRouteParam(params.projectId);
  return <ProjectDocumentsScreen projectId={projectId ?? undefined} />;
}
