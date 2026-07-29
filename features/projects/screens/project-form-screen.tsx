import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  ProjectClassificationSection,
  ProjectCoverSection,
  ProjectFormActions,
  ProjectIdentitySection,
  ProjectScheduleSection
} from "@/features/projects/components/project-form-sections";
import {
  useCreateProject,
  useProject,
  useUpdateProject
} from "@/features/projects/hooks/use-projects";
import { useProjectAccess } from "@/features/projects/hooks/use-project-collaboration";
import {
  projectFormSchema,
  toCreateProjectInput,
  toUpdateProjectInput
} from "@/features/projects/schemas/project.schema";
import type {
  Project,
  ProjectFormValues,
  ProjectSaveOutcome,
  ResolvedProjectAddress
} from "@/features/projects/types/project.types";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import { useAppToast } from "@/shared/ui/components/toast";
import { RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

const defaultValues: ProjectFormValues = {
  address: null,
  building_type: "residential",
  client_id: null,
  coverAsset: null,
  description: "",
  end_date: "",
  estimated_end_date: "",
  estimated_start_date: "",
  name: "",
  phase: "concept",
  progress_percentage: 0,
  project_type: "new_build",
  start_date: "",
  status: "planned"
};

export function ProjectFormScreen({
  mode,
  projectId
}: {
  mode: "create" | "edit";
  projectId?: string;
}) {
  const router = useRouter();
  const appToast = useAppToast();
  const { session } = useAuth();
  const { isCompact, isExpanded } = useLayoutMode();
  const [formError, setFormError] = useState<string | null>(null);
  const projectQuery = useProject(mode === "edit" ? projectId : undefined);
  const accessQuery = useProjectAccess(mode === "edit" ? projectId : undefined);
  const canEdit = mode === "create" || accessQuery.can("project.update");
  const canChangeClient =
    mode === "create" || accessQuery.can("project.change_client");
  const canWriteCover =
    mode === "create" || accessQuery.can("project.cover.write");
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject(projectId ?? "");
  const { control, handleSubmit, reset, setValue, trigger } =
    useForm<ProjectFormValues>({
      defaultValues,
      mode: "onChange",
      resolver: zodResolver(projectFormSchema)
    });
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const clearFormError = useCallback(() => setFormError(null), []);

  useEffect(() => {
    if (mode === "edit" && projectQuery.data) {
      reset(getValuesFromProject(projectQuery.data));
    }
  }, [mode, projectQuery.data, reset]);

  const submitProject = handleSubmit(async (formValues) => {
    if (!session) {
      setFormError("You must be signed in to save projects.");
      return;
    }

    if (!formValues.address) {
      setFormError("Review the highlighted fields before saving.");
      return;
    }

    setFormError(null);

    try {
      const projectValues = formValues as Omit<
        ProjectFormValues,
        "coverAsset"
      > & {
        address: ResolvedProjectAddress;
      };

      if (mode === "create") {
        const outcome = await createMutation.mutateAsync({
          coverAsset: formValues.coverAsset,
          input: toCreateProjectInput({
            values: projectValues
          })
        });

        showProjectSaveToast({ appToast, mode, outcome });
        router.replace(`/projects/${outcome.project.id}` as never);
        return;
      }

      if (!projectId) {
        throw new Error("Missing project id.");
      }

      const outcome = await updateMutation.mutateAsync({
        coverAsset: formValues.coverAsset,
        input: toUpdateProjectInput(projectValues)
      });

      showProjectSaveToast({ appToast, mode, outcome });
      router.replace(`/projects/${projectId}` as never);
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          "We couldn't save this project. Review your connection and try again."
        )
      );
    }
  });

  if (mode === "edit" && (projectQuery.isLoading || accessQuery.isLoading)) {
    return <ProjectFormLoading />;
  }

  if (mode === "edit" && (projectQuery.isError || accessQuery.isError)) {
    return (
      <ProjectFormLoadError
        error={(projectQuery.error ?? accessQuery.error)!}
        onBack={() => router.replace("/projects" as never)}
        onRetry={() => void projectQuery.refetch()}
      />
    );
  }

  if (mode === "edit" && !projectQuery.data) {
    return (
      <ProjectFormNotFound
        onBack={() => router.replace("/projects" as never)}
      />
    );
  }

  if (mode === "edit" && !canEdit) {
    return (
      <ProjectFormNotFound
        onBack={() => router.replace(`/projects/${projectId}` as never)}
      />
    );
  }

  return (
    <Screen>
      <View style={[styles.page, isExpanded && styles.pageExpanded]}>
        <ProjectFormHeader mode={mode} projectId={projectId} />

        <AppCard
          padding="lg"
          style={isExpanded ? styles.formCardExpanded : undefined}
        >
          <View style={styles.formContent}>
            <ProjectCoverSection
              canWrite={canWriteCover}
              control={control}
              currentUrl={projectQuery.data?.cover_image_url ?? null}
              onInteraction={clearFormError}
              setValue={setValue}
            />
            <ProjectIdentitySection
              canChangeClient={canChangeClient}
              control={control}
              onInteraction={clearFormError}
              ownerId={projectQuery.data?.owner_id}
            />
            <ProjectClassificationSection
              control={control}
              isCompact={isCompact}
              onInteraction={clearFormError}
            />
            <ProjectScheduleSection
              control={control}
              isCompact={isCompact}
              onInteraction={clearFormError}
            />

            {formError ? (
              <AppText selectable tone="danger">
                {formError}
              </AppText>
            ) : null}

            <ProjectFormActions
              control={control}
              isCompact={isCompact}
              isSubmitting={isSubmitting}
              mode={mode}
              onCancel={() => router.back()}
              onSubmit={submitProject}
              onValidate={trigger}
            />
          </View>
        </AppCard>
      </View>
    </Screen>
  );
}

function ProjectFormHeader({
  mode,
  projectId
}: {
  mode: "create" | "edit";
  projectId?: string;
}) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Breadcrumb
        items={[
          {
            accessibilityLabel: "Back to projects",
            label: "Projects",
            onPress: () => router.replace("/projects" as never)
          },
          ...(mode === "edit" && projectId
            ? [
                {
                  accessibilityLabel: "Back to project detail",
                  label: "Project Detail",
                  onPress: () =>
                    router.replace(`/projects/${projectId}` as never)
                }
              ]
            : []),
          { label: mode === "create" ? "New" : "Edit" }
        ]}
      />
      <AppHeading variant="hero">
        {mode === "create" ? "Create a project." : "Update project details."}
      </AppHeading>
      <AppText tone="muted">
        Projects anchor site tasks, uploads, location, and future client-facing
        work.
      </AppText>
    </View>
  );
}

function ProjectFormLoading() {
  return (
    <Screen>
      <View style={styles.loading}>
        <SkeletonBlock height={36} width="50%" />
        <SkeletonBlock height={220} />
        <SkeletonBlock height={320} />
      </View>
    </Screen>
  );
}

function ProjectFormLoadError({
  error,
  onBack,
  onRetry
}: {
  error: Error;
  onBack: () => void;
  onRetry: () => void;
}) {
  return (
    <Screen centered>
      <AppCard padding="lg">
        <View style={styles.feedbackCard}>
          <AppHeading variant="section">Project unavailable</AppHeading>
          <AppText tone="muted">
            {getUserFacingErrorMessage(
              error,
              "We couldn't load this project for editing. Check your connection and try again."
            )}
          </AppText>
          <View style={styles.feedbackActions}>
            <AppButton icon={RefreshIcon} onPress={onRetry}>
              Retry
            </AppButton>
            <AppButton color="neutral" onPress={onBack} variant="bordered">
              Back to projects
            </AppButton>
          </View>
        </View>
      </AppCard>
    </Screen>
  );
}

function ProjectFormNotFound({ onBack }: { onBack: () => void }) {
  return (
    <Screen centered>
      <AppCard padding="lg">
        <View style={styles.feedbackCard}>
          <AppHeading variant="section">Project not found</AppHeading>
          <AppText tone="muted">
            This project may have been removed or you may not have access.
          </AppText>
          <AppButton onPress={onBack}>Back to projects</AppButton>
        </View>
      </AppCard>
    </Screen>
  );
}

function showProjectSaveToast({
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

function getValuesFromProject(project: Project): ProjectFormValues {
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

const styles = StyleSheet.create({
  feedbackActions: {
    gap: atomSpacing[3]
  },
  feedbackCard: {
    gap: atomSpacing[4]
  },
  formCardExpanded: {
    alignSelf: "center",
    width: "100%"
  },
  formContent: {
    gap: atomSpacing[5]
  },
  header: {
    gap: atomSpacing[3]
  },
  loading: {
    gap: atomSpacing[5]
  },
  page: {
    gap: atomSpacing[6],
    width: "100%"
  },
  pageExpanded: {
    alignSelf: "center",
    maxWidth: 1120
  }
});
