import { ContractorFormFields } from "@/features/contractors/components/contractor-form-fields";
import {
  useContractor,
  useCreateContractor,
  useUpdateContractor
} from "@/features/contractors/hooks/use-contractors";
import {
  contractorFormSchema,
  getContractorDisplayName,
  toContractorInput
} from "@/features/contractors/schemas/contractor.schema";
import type {
  Contractor,
  ContractorFormValues
} from "@/features/contractors/types/contractor";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppCard } from "@/shared/ui/components/card";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { useAppToast } from "@/shared/ui/components/toast";
import { atomSpacing } from "@/shared/ui/components/theme";
import { HardHatIcon, RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
  const toast = useAppToast();
  const contractorQuery = useContractor(
    mode === "edit" ? contractorId : undefined
  );
  const createMutation = useCreateContractor();
  const updateMutation = useUpdateContractor(contractorId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ContractorFormValues>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(contractorFormSchema)
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
      reset(toFormValues(contractorQuery.data));
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
        description: `${getContractorDisplayName(saved)} was ${
          mode === "create" ? "created" : "updated"
        } successfully.`,
        title: `Contractor ${mode === "create" ? "created" : "updated"}`,
        tone: "success"
      });
      router.replace(`/contractors/${saved.id}` as never);
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          "We couldn't save this contractor. Check your connection and try again."
        )
      );
    }
  });

  if (mode === "edit" && contractorQuery.isLoading) {
    return (
      <Screen>
        <View style={{ gap: atomSpacing[5] }}>
          <SkeletonBlock height={44} width="55%" />
          <SkeletonBlock height={420} />
        </View>
      </Screen>
    );
  }

  if (mode === "edit" && contractorQuery.isError) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void contractorQuery.refetch()
          }}
          description={getUserFacingErrorMessage(
            contractorQuery.error,
            "We couldn't load this contractor. Try again."
          )}
          icon={HardHatIcon}
          title="Contractor unavailable"
        />
      </Screen>
    );
  }

  if (mode === "edit" && !contractorQuery.data) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            label: "Back to directory",
            onPress: () =>
              router.replace("/directory?section=contractors" as never)
          }}
          description="This contractor may have been removed or you may not have access."
          icon={HardHatIcon}
          title="Contractor not found"
        />
      </Screen>
    );
  }

  return (
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
                    accessibilityLabel: "Back to contractor directory",
                    label: "Contractors",
                    onPress: () =>
                      router.replace(
                        "/directory?section=contractors" as never
                      )
                  },
                  {
                    accessibilityLabel: "Back to contractor detail",
                    label: "Contractor Detail",
                    onPress: () =>
                      router.replace(
                        `/contractors/${contractorId}` as never
                      )
                  },
                  { label: "Edit" }
                ]
              : [
                  {
                    accessibilityLabel: "Back to contractor directory",
                    label: "Contractors",
                    onPress: () =>
                      router.replace(
                        "/directory?section=contractors" as never
                      )
                  },
                  { label: "New" }
                ]
          }
        />
        <NavScreenHeader
          description={
            mode === "create"
              ? "Add a contractor contact now and assign workers later."
              : "Update the contact details stored in your contractor catalog."
          }
          title={mode === "create" ? "New contractor" : "Edit contractor"}
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
                {mode === "create"
                  ? "Create contractor"
                  : "Save changes"}
              </AppButton>
            </View>
          </View>
        </AppCard>
      </View>
    </Screen>
  );
}

function toFormValues(contractor: Contractor): ContractorFormValues {
  return {
    email: contractor.email ?? "",
    first_name: contractor.first_name,
    last_name: contractor.last_name ?? "",
    phone_number: contractor.phone_number ?? ""
  };
}
