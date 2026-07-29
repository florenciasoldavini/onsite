import { ProjectTeamContent } from "@/features/projects/components/project-team/project-team-content";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { useRouter } from "expo-router";

export function ProjectTeamScreen({ projectId }: { projectId?: string }) {
  const router = useRouter();

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: {
          action: {
            label: "Back to projects",
            onPress: () => router.replace("/projects" as never)
          }
        }
      }}
      isInvalid={!projectId}
      loadingFallback={null}
      resourceName="project"
    >
      {projectId ? <ProjectTeamContent projectId={projectId} /> : null}
    </RouteStateBoundary>
  );
}
