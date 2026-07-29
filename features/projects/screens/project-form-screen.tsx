import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  ProjectClassificationSection,
  ProjectCoverSection,
  ProjectFormActions,
  ProjectIdentitySection,
  ProjectScheduleSection
} from "@/features/projects/components/project-form-sections";
import {
  ProjectFormHeader,
  ProjectFormSkeleton,
  projectFormStyles
} from "@/features/projects/components/project-form/project-form-presentation";
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
  ProjectFormValues,
  ResolvedProjectAddress
} from "@/features/projects/types/project.types";
import {
  getProjectFormValues,
  showProjectSaveToast
} from "@/features/projects/utils/project-form-values";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppCard } from "@/shared/ui/components/card";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { AppText } from "@/shared/ui/components/text";
import { useAppToast } from "@/shared/ui/components/toast";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { View } from "react-native";

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
      reset(getProjectFormValues(projectQuery.data));
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

  const backToProjects = {
    label: "Back to projects",
    onPress: () => router.replace("/projects" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        forbidden: {
          action: projectId
            ? {
                label: "Back to project",
                onPress: () => router.replace(`/projects/${projectId}` as never)
              }
            : undefined,
          description: "You don't have permission to edit this project.",
          title: "Project editing unavailable"
        },
        invalidParams: { action: backToProjects },
        loadError: {
          action: {
            label: "Retry",
            onPress: () => {
              void Promise.all([projectQuery.refetch(), accessQuery.refetch()]);
            }
          },
          description: getUserFacingErrorMessage(
            projectQuery.error ?? accessQuery.error,
            "We couldn't load this project for editing. Check your connection and try again."
          )
        },
        notFound: { action: backToProjects }
      }}
      isError={mode === "edit" && (projectQuery.isError || accessQuery.isError)}
      isForbidden={mode === "edit" && !canEdit}
      isInvalid={mode === "edit" && !projectId}
      isLoading={
        mode === "edit" && (projectQuery.isLoading || accessQuery.isLoading)
      }
      isNotFound={mode === "edit" && !projectQuery.data}
      loadingFallback={<ProjectFormSkeleton />}
      resourceName="project"
    >
      <Screen>
        <View
          style={[
            projectFormStyles.page,
            isExpanded && projectFormStyles.pageExpanded
          ]}
        >
          <ProjectFormHeader mode={mode} projectId={projectId} />

          <AppCard
            padding="lg"
            style={isExpanded ? projectFormStyles.formCardExpanded : undefined}
          >
            <View style={projectFormStyles.formContent}>
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
    </RouteStateBoundary>
  );
}
