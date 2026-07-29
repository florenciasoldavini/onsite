import { useAuth } from "@/features/auth/hooks/use-auth";
import { WorkerFormFields } from "@/features/workers/components/worker-form-fields";
import {
  useCreateWorker,
  useUpdateWorker,
  useWorker
} from "@/features/workers/hooks/use-workers";
import {
  getWorkerDisplayName,
  toWorkerInput,
  workerFormSchema
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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
  const toast = useAppToast();
  const { user } = useAuth();
  const workerQuery = useWorker(mode === "edit" ? workerId : undefined);
  const createMutation = useCreateWorker();
  const updateMutation = useUpdateWorker(workerId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<WorkerFormValues>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(workerFormSchema)
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
        description: `${getWorkerDisplayName(saved)} was ${
          mode === "create" ? "created" : "updated"
        } successfully.`,
        title: `Worker ${mode === "create" ? "created" : "updated"}`,
        tone: "success"
      });
      router.replace(`/workers/${saved.id}` as never);
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          "We couldn't save this worker. Check your connection and try again."
        )
      );
    }
  });

  const backToDirectory = {
    label: "Back to directory",
    onPress: () => router.replace("/directory?section=workers" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: { action: backToDirectory, icon: UserIcon },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void workerQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            workerQuery.error,
            "We couldn't load this worker. Try again."
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
      resourceName="worker"
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
                      label: "Workers",
                      onPress: () =>
                        router.replace("/directory?section=workers" as never)
                    },
                    {
                      label: "Worker Detail",
                      onPress: () =>
                        router.replace(`/workers/${workerId}` as never)
                    },
                    { label: "Edit" }
                  ]
                : [
                    {
                      label: "Workers",
                      onPress: () =>
                        router.replace("/directory?section=workers" as never)
                    },
                    { label: "New" }
                  ]
            }
          />
          <NavScreenHeader
            description={
              mode === "create"
                ? "Add a worker and record their contractor and usual trades."
                : "Update this worker's contact details and catalog relationships."
            }
            title={mode === "create" ? "New worker" : "Edit worker"}
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
                  Cancel
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
                  {mode === "create" ? "Create worker" : "Save changes"}
                </AppButton>
              </View>
            </View>
          </AppCard>
        </View>
      </Screen>
    </RouteStateBoundary>
  );
}
