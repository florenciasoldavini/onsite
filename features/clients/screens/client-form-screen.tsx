import { ClientFormFields } from "@/features/clients/components/client-form-fields";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  clientFormSchema,
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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
  const toast = useAppToast();
  const { user } = useAuth();
  const clientQuery = useClient(mode === "edit" ? clientId : undefined);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient(clientId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ClientFormValues>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(clientFormSchema)
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
        description: `${getClientDisplayName(saved)} was ${
          mode === "create" ? "created" : "updated"
        } successfully.`,
        title: `Client ${mode === "create" ? "created" : "updated"}`,
        tone: "success"
      });
      router.replace(`/clients/${saved.id}` as never);
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          "We couldn't save this client. Check your connection and try again."
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
    label: "Back to clients",
    onPress: () => router.replace("/directory?section=clients" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        forbidden: {
          action: existingClient
            ? {
                label: "Back to client",
                onPress: () =>
                  router.replace(`/clients/${existingClient.id}` as never)
              }
            : undefined,
          description: "You don't have permission to edit this client.",
          icon: UserIcon,
          title: "Client editing unavailable"
        },
        invalidParams: { action: backToClients, icon: UserIcon },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void clientQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            clientQuery.error,
            "We couldn't load this client. Try again."
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
      resourceName="client"
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
                  accessibilityLabel: "Back to clients",
                  label: "Client",
                  onPress: () =>
                    router.replace("/directory?section=clients" as never)
                },
                {
                  accessibilityLabel: "Back to client detail",
                  label: "Client Detail",
                  onPress: () => router.replace(`/clients/${clientId}` as never)
                },
                { label: "Edit" }
              ]}
            />
          ) : (
            <Breadcrumb
              items={[
                {
                  accessibilityLabel: "Back to clients",
                  label: "Client",
                  onPress: () =>
                    router.replace("/directory?section=clients" as never)
                },
                { label: "New" }
              ]}
            />
          )}
          <NavScreenHeader
            description={
              mode === "create"
                ? "Add contact details now and link the client to projects when needed."
                : "Update the contact details stored in your client catalog."
            }
            title={mode === "create" ? "New client" : "Edit client"}
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
                  {mode === "create" ? "Create client" : "Save changes"}
                </AppButton>
              </View>
            </View>
          </AppCard>
        </View>
      </Screen>
    </RouteStateBoundary>
  );
}
