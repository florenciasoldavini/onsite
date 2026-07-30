import { ProjectDetailContent } from "@/features/projects/components/project-detail/project-detail-content";
import { ProjectDetailSkeleton } from "@/features/projects/components/project-detail/project-detail-skeleton";
import { useProject } from "@/features/projects/hooks/use-projects";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

type ProjectDetailScreenProps = {
  projectId?: string;
};

export default function ProjectDetailScreen({
  projectId
}: ProjectDetailScreenProps) {
  const router = useRouter();
  const { t } = useTranslation("features/projects");
  const { t: tShared } = useTranslation("shared");
  const projectQuery = useProject(projectId);
  const backToProjects = {
    label: t(($) => $["features/projects"].actions.backProjects),
    onPress: () => router.replace("/projects" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: { action: backToProjects },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: tShared(($) => $.shared.actions.retry),
            onPress: () => void projectQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            projectQuery.error,
            t(($) => $["features/projects"].errors.load)
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
