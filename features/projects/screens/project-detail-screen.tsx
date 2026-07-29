import { ProjectDetailContent } from "@/features/projects/components/project-detail/project-detail-content";
import { ProjectDetailSkeleton } from "@/features/projects/components/project-detail/project-detail-skeleton";
import { useProject } from "@/features/projects/hooks/use-projects";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";

type ProjectDetailScreenProps = {
  projectId?: string;
};

export default function ProjectDetailScreen({
  projectId
}: ProjectDetailScreenProps) {
  const router = useRouter();
  const projectQuery = useProject(projectId);
  const backToProjects = {
    label: "Back to projects",
    onPress: () => router.replace("/projects" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: { action: backToProjects },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void projectQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            projectQuery.error,
            "We couldn't load this project. Check your connection and try again."
          )
        },
        notFound: { action: backToProjects }
      }}
      isError={projectQuery.isError}
      isInvalid={!projectId}
      isLoading={projectQuery.isLoading}
      isNotFound={!projectQuery.data}
      loadingFallback={<ProjectDetailSkeleton />}
      resourceName="project"
    >
      {projectQuery.data ? (
        <ProjectDetailContent project={projectQuery.data} />
      ) : null}
    </RouteStateBoundary>
  );
}
