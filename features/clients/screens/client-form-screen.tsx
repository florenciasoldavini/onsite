import { ClientFormFields } from "@/features/clients/components/client-form-fields";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  createClientFormSchema,
  getClientDisplayName,
  toClientInput
} from "@/features/clients/schemas/client.schema";
import {
  useClient,
  useCreateClient,
  useUpdateClient
} from "@/features/clients/hooks/use-clients";
import type { ClientFormValues } from "@/features/clients/types/client";
import { getClientFormValues } from "@/features/clients/utils/client-form-values";
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

const defaultValues: ClientFormValues = {
  email: "",
  first_name: "",
  last_name: "",
  phone_number: ""
};

export default function ClientFormScreen({
  clientId,
  mode
}: {
  clientId?: string;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const { t } = useTranslation("features/clients");
  const { i18n, t: tShared } = useTranslation("shared");
  const toast = useAppToast();
  const { user } = useAuth();
  const clientQuery = useClient(mode === "edit" ? clientId : undefined);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient(clientId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const formSchema = useMemo(
    () => createClientFormSchema(tShared),
    [i18n.resolvedLanguage, tShared]
  );
  const form = useForm<ClientFormValues>({
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
    if (clientQuery.data) {
      reset(getClientFormValues(clientQuery.data));
    }
  }, [clientQuery.data, reset]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const saved =
        mode === "create"
          ? await createMutation.mutateAsync(toClientInput(values))
          : await updateMutation.mutateAsync(toClientInput(values));
      toast.show({
        description:
          mode === "create"
            ? t(($) => $["features/clients"].toast.createdDescription, {
                name: getClientDisplayName(saved)
              })
            : t(($) => $["features/clients"].toast.updatedDescription, {
                name: getClientDisplayName(saved)
              }),
        title:
          mode === "create"
            ? t(($) => $["features/clients"].toast.createdTitle)
            : t(($) => $["features/clients"].toast.updatedTitle),
        tone: "success"
      });
      router.replace(`/clients/${saved.id}` as never);
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/clients"].errors.save)
        )
      );
    }
  });

  const existingClient = clientQuery.data;
  const canManageClient =
    mode === "create" ||
    user?.role === "admin" ||
    user?.id === existingClient?.owner_id;
  const backToClients = {
    label: t(($) => $["features/clients"].accessibility.backToClients),
    onPress: () => router.replace("/directory?section=clients" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        forbidden: {
          action: existingClient
            ? {
                label: t(
                  ($) => $["features/clients"].accessibility.backToClient
                ),
                onPress: () =>
                  router.replace(`/clients/${existingClient.id}` as never)
              }
            : undefined,
          description: t(($) => $["features/clients"].errors.editForbidden),
          icon: UserIcon,
          title: t(($) => $["features/clients"].errors.editUnavailable)
        },
        invalidParams: { action: backToClients, icon: UserIcon },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: tShared(($) => $.shared.actions.retry),
            onPress: () => void clientQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            clientQuery.error,
            t(($) => $["features/clients"].errors.load)
          ),
          icon: UserIcon
        },
        notFound: { action: backToClients, icon: UserIcon }
      }}
      isError={mode === "edit" && clientQuery.isError}
      isForbidden={mode === "edit" && !canManageClient}
      isInvalid={mode === "edit" && !clientId}
      isLoading={mode === "edit" && clientQuery.isLoading}
      isNotFound={mode === "edit" && !clientQuery.data}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={44} width="55%" />
            <SkeletonBlock height={420} />
          </View>
        </Screen>
      }
      resourceName={t(($) => $["features/clients"].fields.client)}
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
          {mode === "edit" && clientId ? (
            <Breadcrumb
              items={[
                {
                  accessibilityLabel: t(
                    ($) => $["features/clients"].accessibility.backToClients
                  ),
                  label: t(($) => $["features/clients"].breadcrumbs.client),
                  onPress: () =>
                    router.replace("/directory?section=clients" as never)
                },
                {
                  accessibilityLabel: t(
                    ($) =>
                      $["features/clients"].accessibility.backToClientDetail
                  ),
                  label: t(($) => $["features/clients"].breadcrumbs.detail),
                  onPress: () => router.replace(`/clients/${clientId}` as never)
                },
                { label: t(($) => $["features/clients"].breadcrumbs.edit) }
              ]}
            />
          ) : (
            <Breadcrumb
              items={[
                {
                  accessibilityLabel: t(
                    ($) => $["features/clients"].accessibility.backToClients
                  ),
                  label: t(($) => $["features/clients"].breadcrumbs.client),
                  onPress: () =>
                    router.replace("/directory?section=clients" as never)
                },
                { label: t(($) => $["features/clients"].breadcrumbs.new) }
              ]}
            />
          )}
          <NavScreenHeader
            description={
              mode === "create"
                ? t(($) => $["features/clients"].form.createDescription)
                : t(($) => $["features/clients"].form.editDescription)
            }
            title={
              mode === "create"
                ? t(($) => $["features/clients"].form.createTitle)
                : t(($) => $["features/clients"].form.editTitle)
            }
          />
          <AppCard padding="lg">
            <View style={{ gap: atomSpacing[6] }}>
              <ClientFormFields
                control={control}
                onChange={() => setFormError(null)}
              />
              {formError ? <AppText tone="danger">{formError}</AppText> : null}
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
                    ? t(($) => $["features/clients"].actions.create)
                    : t(($) => $["features/clients"].actions.save)}
                </AppButton>
              </View>
            </View>
          </AppCard>
        </View>
      </Screen>
    </RouteStateBoundary>
  );
}
