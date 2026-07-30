import { ContractorFormFields } from "@/features/contractors/components/contractor-form-fields";
import {
  useContractor,
  useCreateContractor,
  useUpdateContractor
} from "@/features/contractors/hooks/use-contractors";
import {
  createContractorFormSchema,
  getContractorDisplayName,
  toContractorInput
} from "@/features/contractors/schemas/contractor.schema";
import type { ContractorFormValues } from "@/features/contractors/types/contractor";
import { getContractorFormValues } from "@/features/contractors/utils/contractor-form-values";
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
import { HardHatIcon, RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const defaultValues: ContractorFormValues = {
  email: "",
  first_name: "",
  last_name: "",
  phone_number: ""
};

export default function ContractorFormScreen({
  contractorId,
  mode
}: {
  contractorId?: string;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const { t } = useTranslation("features/contractors");
  const { i18n, t: tShared } = useTranslation("shared");
  const toast = useAppToast();
  const contractorQuery = useContractor(
    mode === "edit" ? contractorId : undefined
  );
  const createMutation = useCreateContractor();
  const updateMutation = useUpdateContractor(contractorId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const formSchema = useMemo(
    () => createContractorFormSchema(tShared),
    [i18n.resolvedLanguage, tShared]
  );
  const form = useForm<ContractorFormValues>({
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
    if (contractorQuery.data) {
      reset(getContractorFormValues(contractorQuery.data));
    }
  }, [contractorQuery.data, reset]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const saved =
        mode === "create"
          ? await createMutation.mutateAsync(toContractorInput(values))
          : await updateMutation.mutateAsync(toContractorInput(values));
      toast.show({
        description:
          mode === "create"
            ? t(($) => $["features/contractors"].toast.createdDescription, {
                name: getContractorDisplayName(saved)
              })
            : t(($) => $["features/contractors"].toast.updatedDescription, {
                name: getContractorDisplayName(saved)
              }),
        title:
          mode === "create"
            ? t(($) => $["features/contractors"].toast.createdTitle)
            : t(($) => $["features/contractors"].toast.updatedTitle),
        tone: "success"
      });
      router.replace(`/contractors/${saved.id}` as never);
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/contractors"].errors.save)
        )
      );
    }
  });

  const backToDirectory = {
    label: t(($) => $["features/contractors"].accessibility.backToDirectory),
    onPress: () => router.replace("/directory?section=contractors" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: { action: backToDirectory, icon: HardHatIcon },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: tShared(($) => $.shared.actions.retry),
            onPress: () => void contractorQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            contractorQuery.error,
            t(($) => $["features/contractors"].errors.load)
          ),
          icon: HardHatIcon
        },
        notFound: { action: backToDirectory, icon: HardHatIcon }
      }}
      isError={mode === "edit" && contractorQuery.isError}
      isInvalid={mode === "edit" && !contractorId}
      isLoading={mode === "edit" && contractorQuery.isLoading}
      isNotFound={mode === "edit" && !contractorQuery.data}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={44} width="55%" />
            <SkeletonBlock height={420} />
          </View>
        </Screen>
      }
      resourceName={t(($) => $["features/contractors"].fields.contractor)}
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
              mode === "edit" && contractorId
                ? [
                    {
                      accessibilityLabel: t(
                        ($) =>
                          $["features/contractors"].accessibility.backToDirectory
                      ),
                      label: t(
                        ($) =>
                          $["features/contractors"].breadcrumbs.contractors
                      ),
                      onPress: () =>
                        router.replace(
                          "/directory?section=contractors" as never
                        )
                    },
                    {
                      accessibilityLabel: t(
                        ($) =>
                          $["features/contractors"].accessibility.backToDetail
                      ),
                      label: t(
                        ($) => $["features/contractors"].breadcrumbs.detail
                      ),
                      onPress: () =>
                        router.replace(`/contractors/${contractorId}` as never)
                    },
                    {
                      label: t(
                        ($) => $["features/contractors"].breadcrumbs.edit
                      )
                    }
                  ]
                : [
                    {
                      accessibilityLabel: t(
                        ($) =>
                          $["features/contractors"].accessibility.backToDirectory
                      ),
                      label: t(
                        ($) =>
                          $["features/contractors"].breadcrumbs.contractors
                      ),
                      onPress: () =>
                        router.replace(
                          "/directory?section=contractors" as never
                        )
                    },
                    {
                      label: t(
                        ($) => $["features/contractors"].breadcrumbs.new
                      )
                    }
                  ]
            }
          />
          <NavScreenHeader
            description={
              mode === "create"
                ? t(($) => $["features/contractors"].form.createDescription)
                : t(($) => $["features/contractors"].form.editDescription)
            }
            title={
              mode === "create"
                ? t(($) => $["features/contractors"].form.createTitle)
                : t(($) => $["features/contractors"].form.editTitle)
            }
          />
          <AppCard padding="lg">
            <View style={{ gap: atomSpacing[6] }}>
              <ContractorFormFields
                control={control}
                onChange={() => setFormError(null)}
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
                    ? t(($) => $["features/contractors"].actions.create)
                    : t(($) => $["features/contractors"].actions.save)}
                </AppButton>
              </View>
            </View>
          </AppCard>
        </View>
      </Screen>
    </RouteStateBoundary>
  );
}
