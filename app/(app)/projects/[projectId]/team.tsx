import { ProjectTeamScreen } from "@/features/projects/screens/project-team-screen";
import { useLocalSearchParams } from "expo-router";

export default function ProjectTeamRoute() {
  const params = useLocalSearchParams<{ projectId?: string | string[] }>();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  return <ProjectTeamScreen projectId={projectId} />;
}
