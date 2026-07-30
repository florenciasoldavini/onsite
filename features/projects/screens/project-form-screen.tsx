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
  createProjectFormSchema,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
  const { i18n, t } = useTranslation("features/projects");
  const { t: tShared } = useTranslation("shared");
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
  const validationSchema = useMemo(
    () => createProjectFormSchema(t),
    [i18n.resolvedLanguage, t]
  );
  const { control, handleSubmit, reset, setValue, trigger } =
    useForm<ProjectFormValues>({
      defaultValues,
      mode: "onChange",
      resolver: zodResolver(validationSchema)
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
      setFormError(t(($) => $["features/projects"].validation.signIn));
      return;
    }

    if (!formValues.address) {
      setFormError(t(($) => $["features/projects"].validation.review));
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

        showProjectSaveToast({ appToast, mode, outcome, t });
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

      showProjectSaveToast({ appToast, mode, outcome, t });
      router.replace(`/projects/${projectId}` as never);
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/projects"].errors.save)
        )
      );
    }
  });

  const backToProjects = {
    label: t(($) => $["features/projects"].actions.backProjects),
    onPress: () => router.replace("/projects" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        forbidden: {
          action: projectId
            ? {
                label: t(($) => $["features/projects"].actions.backProject),
                onPress: () => router.replace(`/projects/${projectId}` as never)
              }
            : undefined,
          description: t(
            ($) => $["features/projects"].errors.editForbidden
          ),
          title: t(($) => $["features/projects"].errors.editUnavailable)
        },
        invalidParams: { action: backToProjects },
        loadError: {
          action: {
            label: tShared(($) => $.shared.actions.retry),
            onPress: () => {
              void Promise.all([projectQuery.refetch(), accessQuery.refetch()]);
            }
          },
          description: getUserFacingErrorMessage(
            projectQuery.error ?? accessQuery.error,
            t(($) => $["features/projects"].errors.editLoad)
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
