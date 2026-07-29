import { useClient } from "@/features/clients/hooks/use-clients";
import { ProjectActionGrid } from "@/features/projects/components/project-detail/project-action-grid";
import { ProjectClientCard } from "@/features/projects/components/project-detail/project-client-card";
import { ProjectDetailHeader } from "@/features/projects/components/project-detail/project-detail-header";
import { projectDetailStyles } from "@/features/projects/components/project-detail/project-detail.styles";
import { ProjectProgressCard } from "@/features/projects/components/project-detail/project-progress-card";
import { useProjectAccess } from "@/features/projects/hooks/use-project-collaboration";
import type { Project } from "@/features/projects/types/project.types";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { Screen } from "@/shared/ui/components/screen";
import { useRouter } from "expo-router";
import { View } from "react-native";

export function ProjectDetailContent({ project }: { project: Project }) {
  const router = useRouter();
  const { isExpanded } = useLayoutMode();
  const accessQuery = useProjectAccess(project.id);
  const clientQuery = useClient(project.client_id ?? undefined);

  return (
    <Screen>
      <View style={projectDetailStyles.pageStack}>
        <Breadcrumb
          items={[
            {
              accessibilityLabel: "Back to projects",
              label: "Projects",
              onPress: () => router.replace("/projects" as never)
            },
            { label: "Project Detail" }
          ]}
        />

        <ProjectDetailHeader project={project} />

        {project.client_id ? (
          <ProjectClientCard clientQuery={clientQuery} />
        ) : null}

        <View
          style={[
            projectDetailStyles.detailWorkspace,
            isExpanded ? projectDetailStyles.detailWorkspaceExpanded : null
          ]}
        >
          <ProjectProgressCard expanded={isExpanded} project={project} />
          <ProjectActionGrid
            canReadMembers={accessQuery.can("project.members.read")}
            expanded={isExpanded}
            projectId={project.id}
          />
        </View>
      </View>
    </Screen>
  );
}
