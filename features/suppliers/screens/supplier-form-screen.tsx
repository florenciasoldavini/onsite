import { SupplierFormFields } from "@/features/suppliers/components/supplier-form-fields";
import {
  useCreateSupplier,
  useSupplier,
  useUpdateSupplier
} from "@/features/suppliers/hooks/use-suppliers";
import {
  supplierFormSchema,
  toSupplierInput
} from "@/features/suppliers/schemas/supplier.schema";
import type {
  Supplier,
  SupplierFormValues
} from "@/features/suppliers/types/supplier";
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
import { RefreshIcon, StoreIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { View } from "react-native";

const defaultValues: SupplierFormValues = {
  address: null,
  contact_name: "",
  email: "",
  name: "",
  notes: "",
  phone_number: "",
  website_url: ""
};

export default function SupplierFormScreen({
  mode,
  supplierId
}: {
  mode: "create" | "edit";
  supplierId?: string;
}) {
  const router = useRouter();
  const toast = useAppToast();
  const supplierQuery = useSupplier(
    mode === "edit" ? supplierId : undefined
  );
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier(supplierId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<SupplierFormValues>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(supplierFormSchema)
  });
  const {
    control,
    formState: { isDirty, isValid },
    handleSubmit,
    reset,
    watch
  } = form;
  const name = watch("name");
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (supplierQuery.data) reset(toFormValues(supplierQuery.data));
  }, [reset, supplierQuery.data]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const saved =
        mode === "create"
          ? await createMutation.mutateAsync(toSupplierInput(values))
          : await updateMutation.mutateAsync(toSupplierInput(values));
      toast.show({
        description: `${saved.name} was ${
          mode === "create" ? "created" : "updated"
        } successfully.`,
        title: `Supplier ${mode === "create" ? "created" : "updated"}`,
        tone: "success"
      });
      router.replace(`/suppliers/${saved.id}` as never);
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          "We couldn't save this supplier. Check your connection and try again."
        )
      );
    }
  });

  if (mode === "edit" && supplierQuery.isLoading) {
    return (
      <Screen>
        <View style={{ gap: atomSpacing[5] }}>
          <SkeletonBlock height={44} width="55%" />
          <SkeletonBlock height={560} />
        </View>
      </Screen>
    );
  }

  if (mode === "edit" && supplierQuery.isError) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void supplierQuery.refetch()
          }}
          description={getUserFacingErrorMessage(
            supplierQuery.error,
            "We couldn't load this supplier. Try again."
          )}
          icon={StoreIcon}
          title="Supplier unavailable"
        />
      </Screen>
    );
  }

  if (mode === "edit" && !supplierQuery.data) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            label: "Back to directory",
            onPress: () =>
              router.replace("/directory?section=suppliers" as never)
          }}
          description="This supplier may have been removed or you may not have access."
          icon={StoreIcon}
          title="Supplier not found"
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
            mode === "edit" && supplierId
              ? [
                  {
                    label: "Suppliers",
                    onPress: () =>
                      router.replace(
                        "/directory?section=suppliers" as never
                      )
                  },
                  {
                    label: "Supplier Detail",
                    onPress: () =>
                      router.replace(`/suppliers/${supplierId}` as never)
                  },
                  { label: "Edit" }
                ]
              : [
                  {
                    label: "Suppliers",
                    onPress: () =>
                      router.replace(
                        "/directory?section=suppliers" as never
                      )
                  },
                  { label: "New" }
                ]
          }
        />
        <NavScreenHeader
          description={
            mode === "create"
              ? "Add a supplier's contact, website, and location details."
              : "Update the supplier information stored in your directory."
          }
          showBreadcrumb={false}
          title={mode === "create" ? "New supplier" : "Edit supplier"}
        />
        <AppCard padding="lg">
          <View style={{ gap: atomSpacing[6] }}>
            <SupplierFormFields
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
                  name.trim().length < 2 ||
                  (mode === "edit" && !isDirty)
                }
                loading={isSubmitting}
                onPress={() => void submit()}
              >
                {mode === "create" ? "Create supplier" : "Save changes"}
              </AppButton>
            </View>
          </View>
        </AppCard>
      </View>
    </Screen>
  );
}

function toFormValues(supplier: Supplier): SupplierFormValues {
  const hasAddress =
    supplier.address &&
    supplier.google_place_id &&
    supplier.latitude !== null &&
    supplier.longitude !== null;

  return {
    address: hasAddress
      ? {
          address: supplier.address!,
          latitude: supplier.latitude!,
          longitude: supplier.longitude!,
          placeId: supplier.google_place_id!
        }
      : null,
    contact_name: supplier.contact_name ?? "",
    email: supplier.email ?? "",
    name: supplier.name,
    notes: supplier.notes ?? "",
    phone_number: supplier.phone_number ?? "",
    website_url: supplier.website_url ?? ""
  };
}
