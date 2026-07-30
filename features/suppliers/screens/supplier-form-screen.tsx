import { SupplierFormFields } from "@/features/suppliers/components/supplier-form-fields";
import {
  useCreateSupplier,
  useSupplier,
  useUpdateSupplier
} from "@/features/suppliers/hooks/use-suppliers";
import {
  createSupplierFormSchema,
  toSupplierInput
} from "@/features/suppliers/schemas/supplier.schema";
import type { SupplierFormValues } from "@/features/suppliers/types/supplier";
import { getSupplierFormValues } from "@/features/suppliers/utils/supplier-form-values";
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
import { RefreshIcon, StoreIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
  const { i18n, t } = useTranslation("features/suppliers");
  const { t: tShared } = useTranslation("shared");
  const toast = useAppToast();
  const supplierQuery = useSupplier(mode === "edit" ? supplierId : undefined);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier(supplierId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const validationSchema = useMemo(
    () => createSupplierFormSchema(t, tShared),
    [i18n.resolvedLanguage, t, tShared]
  );
  const form = useForm<SupplierFormValues>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(validationSchema)
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
    if (supplierQuery.data) reset(getSupplierFormValues(supplierQuery.data));
  }, [reset, supplierQuery.data]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const saved =
        mode === "create"
          ? await createMutation.mutateAsync(toSupplierInput(values))
          : await updateMutation.mutateAsync(toSupplierInput(values));
      toast.show({
        description: t(
          ($) =>
            mode === "create"
              ? $["features/suppliers"].toast.createdDescription
              : $["features/suppliers"].toast.updatedDescription,
          { name: saved.name }
        ),
        title: t(($) =>
          mode === "create"
            ? $["features/suppliers"].toast.createdTitle
            : $["features/suppliers"].toast.updatedTitle
        ),
        tone: "success"
      });
      router.replace(`/suppliers/${saved.id}` as never);
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/suppliers"].errors.save)
        )
      );
    }
  });

  const backToDirectory = {
    label: t(($) => $["features/suppliers"].actions.backToDirectory),
    onPress: () => router.replace("/directory?section=suppliers" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: { action: backToDirectory, icon: StoreIcon },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: tShared(($) => $.shared.actions.retry),
            onPress: () => void supplierQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            supplierQuery.error,
            t(($) => $["features/suppliers"].errors.load)
          ),
          icon: StoreIcon
        },
        notFound: { action: backToDirectory, icon: StoreIcon }
      }}
      isError={mode === "edit" && supplierQuery.isError}
      isInvalid={mode === "edit" && !supplierId}
      isLoading={mode === "edit" && supplierQuery.isLoading}
      isNotFound={mode === "edit" && !supplierQuery.data}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={44} width="55%" />
            <SkeletonBlock height={560} />
          </View>
        </Screen>
      }
      resourceName="supplier"
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
              mode === "edit" && supplierId
                ? [
                    {
                      label: t(
                        ($) => $["features/suppliers"].breadcrumbs.suppliers
                      ),
                      onPress: () =>
                        router.replace("/directory?section=suppliers" as never)
                    },
                    {
                      label: t(
                        ($) => $["features/suppliers"].breadcrumbs.detail
                      ),
                      onPress: () =>
                        router.replace(`/suppliers/${supplierId}` as never)
                    },
                    {
                      label: t(
                        ($) => $["features/suppliers"].breadcrumbs.edit
                      )
                    }
                  ]
                : [
                    {
                      label: t(
                        ($) => $["features/suppliers"].breadcrumbs.suppliers
                      ),
                      onPress: () =>
                        router.replace("/directory?section=suppliers" as never)
                    },
                    {
                      label: t(
                        ($) => $["features/suppliers"].breadcrumbs.new
                      )
                    }
                  ]
            }
          />
          <NavScreenHeader
            description={
              mode === "create"
                ? t(
                    ($) => $["features/suppliers"].form.createDescription
                  )
                : t(($) => $["features/suppliers"].form.editDescription)
            }
            showBreadcrumb={false}
            title={t(($) =>
              mode === "create"
                ? $["features/suppliers"].form.createTitle
                : $["features/suppliers"].form.editTitle
            )}
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
                  {tShared(($) => $.shared.actions.cancel)}
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
                  {t(($) =>
                    mode === "create"
                      ? $["features/suppliers"].actions.create
                      : $["features/suppliers"].actions.save
                  )}
                </AppButton>
              </View>
            </View>
          </AppCard>
        </View>
      </Screen>
    </RouteStateBoundary>
  );
}
