import { ProjectTeamContent } from "@/features/projects/components/project-team/project-team-content";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export function ProjectTeamScreen({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const { t } = useTranslation("features/projects");

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: {
          action: {
            label: t(($) => $["features/projects"].actions.backProjects),
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
