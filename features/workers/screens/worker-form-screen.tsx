import { useAuth } from "@/features/auth/hooks/use-auth";
import { WorkerFormFields } from "@/features/workers/components/worker-form-fields";
import {
  useCreateWorker,
  useUpdateWorker,
  useWorker
} from "@/features/workers/hooks/use-workers";
import {
  getWorkerDisplayName,
  createWorkerFormSchema,
  toWorkerInput,
} from "@/features/workers/schemas/worker.schema";
import type { WorkerFormValues } from "@/features/workers/types/worker";
import { getWorkerFormValues } from "@/features/workers/utils/worker-form-values";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppCard } from "@/shared/ui/components/card";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { useAppToast } from "@/shared/ui/components/toast";
import { atomSpacing } from "@/shared/ui/components/theme";
import { RefreshIcon, UserIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const defaultValues: WorkerFormValues = {
  contractor_id: null,
  email: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  trade_category_ids: []
};

export default function WorkerFormScreen({
  mode,
  workerId
}: {
  mode: "create" | "edit";
  workerId?: string;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/workers");
  const { i18n, t: tShared } = useTranslation("shared");
  const toast = useAppToast();
  const { user } = useAuth();
  const workerQuery = useWorker(mode === "edit" ? workerId : undefined);
  const createMutation = useCreateWorker();
  const updateMutation = useUpdateWorker(workerId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const formSchema = useMemo(
    () => createWorkerFormSchema(tShared),
    [i18n.resolvedLanguage, tShared]
  );
  const form = useForm<WorkerFormValues>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(formSchema)
  });
  const {
    control,
    formState: { isDirty, isValid },
    handleSubmit,
    reset,
    watch
  } = form;
  const firstName = watch("first_name");
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (workerQuery.data) reset(getWorkerFormValues(workerQuery.data));
  }, [reset, workerQuery.data]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const saved =
        mode === "create"
          ? await createMutation.mutateAsync(toWorkerInput(values))
          : await updateMutation.mutateAsync(toWorkerInput(values));
      toast.show({
        description:
          mode === "create"
            ? t(($) => $["features/workers"].toast.createdDescription, {
                name: getWorkerDisplayName(saved)
              })
            : t(($) => $["features/workers"].toast.updatedDescription, {
                name: getWorkerDisplayName(saved)
              }),
        title:
          mode === "create"
            ? t(($) => $["features/workers"].toast.createdTitle)
            : t(($) => $["features/workers"].toast.updatedTitle),
        tone: "success"
      });
      router.replace(`/workers/${saved.id}` as never);
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/workers"].errors.save)
        )
      );
    }
  });

  const backToDirectory = {
    label: t(($) => $["features/workers"].accessibility.backToDirectory),
    onPress: () => router.replace("/directory?section=workers" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: { action: backToDirectory, icon: UserIcon },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: tShared(($) => $.shared.actions.retry),
            onPress: () => void workerQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            workerQuery.error,
            t(($) => $["features/workers"].errors.load)
          ),
          icon: UserIcon
        },
        notFound: { action: backToDirectory, icon: UserIcon }
      }}
      isError={mode === "edit" && workerQuery.isError}
      isInvalid={mode === "edit" && !workerId}
      isLoading={mode === "edit" && workerQuery.isLoading}
      isNotFound={mode === "edit" && !workerQuery.data}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={44} width="55%" />
            <SkeletonBlock height={540} />
          </View>
        </Screen>
      }
      resourceName={t(($) => $["features/workers"].fields.worker)}
    >
      <Screen keyboardSafe>
        <View
          style={{
            alignSelf: "center",
            gap: atomSpacing[6],
            maxWidth: 760,
            width: "100%"
          }}
        >
          <Breadcrumb
            items={
              mode === "edit" && workerId
                ? [
                    {
                      label: t(($) => $["features/workers"].breadcrumbs.workers),
                      onPress: () =>
                        router.replace("/directory?section=workers" as never)
                    },
                    {
                      label: t(($) => $["features/workers"].breadcrumbs.detail),
                      onPress: () =>
                        router.replace(`/workers/${workerId}` as never)
                    },
                    { label: t(($) => $["features/workers"].breadcrumbs.edit) }
                  ]
                : [
                    {
                      label: t(($) => $["features/workers"].breadcrumbs.workers),
                      onPress: () =>
                        router.replace("/directory?section=workers" as never)
                    },
                    { label: t(($) => $["features/workers"].breadcrumbs.new) }
                  ]
            }
          />
          <NavScreenHeader
            description={
              mode === "create"
                ? t(($) => $["features/workers"].form.createDescription)
                : t(($) => $["features/workers"].form.editDescription)
            }
            title={
              mode === "create"
                ? t(($) => $["features/workers"].form.createTitle)
                : t(($) => $["features/workers"].form.editTitle)
            }
          />
          <AppCard padding="lg">
            <View style={{ gap: atomSpacing[6] }}>
              <WorkerFormFields
                control={control}
                onChange={() => setFormError(null)}
                ownerId={workerQuery.data?.owner_id ?? user?.id}
              />
              {formError ? (
                <AppText selectable tone="danger">
                  {formError}
                </AppText>
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  gap: atomSpacing[3],
                  justifyContent: "flex-end"
                }}
              >
                <AppButton
                  color="neutral"
                  fullWidth={false}
                  isDisabled={isSubmitting}
                  onPress={() => router.back()}
                  variant="bordered"
                >
                  {tShared(($) => $.shared.actions.cancel)}
                </AppButton>
                <AppButton
                  fullWidth={false}
                  isDisabled={
                    !isValid ||
                    firstName.trim().length === 0 ||
                    (mode === "edit" && !isDirty)
                  }
                  loading={isSubmitting}
                  onPress={() => void submit()}
                >
                  {mode === "create"
                    ? t(($) => $["features/workers"].actions.create)
                    : t(($) => $["features/workers"].actions.save)}
                </AppButton>
              </View>
            </View>
          </AppCard>
        </View>
      </Screen>
    </RouteStateBoundary>
  );
}
