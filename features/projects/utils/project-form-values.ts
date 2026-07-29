import type {
  Project,
  ProjectFormValues,
  ProjectSaveOutcome
} from "@/features/projects/types/project.types";
import type { useAppToast } from "@/shared/ui/components/toast";

export function showProjectSaveToast({
  appToast,
  mode,
  outcome
}: {
  appToast: ReturnType<typeof useAppToast>;
  mode: "create" | "edit";
  outcome: ProjectSaveOutcome;
}) {
  const action = mode === "create" ? "created" : "updated";

  if (outcome.coverStatus === "failed") {
    appToast.show({
      description: `${outcome.project.name} was ${action}, but its cover couldn't be uploaded. You can add it later by editing the project.`,
      title: `Project ${action}`,
      tone: "warning"
    });
    return;
  }

  appToast.show({
    description: `${outcome.project.name} was ${action} successfully.`,
    title: `Project ${action}`,
    tone: "success"
  });
}

export function getProjectFormValues(project: Project): ProjectFormValues {
  return {
    address: {
      address: project.address,
      latitude: project.latitude,
      longitude: project.longitude,
      placeId: project.google_place_id
    },
    building_type: project.building_type,
    client_id: project.client_id,
    coverAsset: null,
    description: project.description ?? "",
    end_date: project.end_date ?? "",
    estimated_end_date: project.estimated_end_date ?? "",
    estimated_start_date: project.estimated_start_date ?? "",
    name: project.name,
    phase: project.phase,
    progress_percentage: project.progress_percentage,
    project_type: project.project_type,
    start_date: project.start_date ?? "",
    status: project.status
  };
}
