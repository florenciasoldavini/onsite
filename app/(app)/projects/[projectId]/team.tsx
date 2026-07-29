import { ProjectTeamScreen } from "@/features/projects/screens/project-team-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function ProjectTeamRoute() {
  const params = useLocalSearchParams<{ projectId: string | string[] }>();
  const projectId = parseRequiredUuidRouteParam(params.projectId);

  return <ProjectTeamScreen projectId={projectId ?? undefined} />;
}
