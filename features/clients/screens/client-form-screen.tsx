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
import type { Client, ClientFormValues } from "@/features/clients/types/client";
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
      reset(toFormValues(clientQuery.data));
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

  if (mode === "edit" && clientQuery.isLoading) {
    return (
      <Screen>
        <View style={{ gap: atomSpacing[5] }}>
          <SkeletonBlock height={44} width="55%" />
          <SkeletonBlock height={420} />
        </View>
      </Screen>
    );
  }

  if (mode === "edit" && clientQuery.isError) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void clientQuery.refetch()
          }}
          description={getUserFacingErrorMessage(
            clientQuery.error,
            "We couldn't load this client. Try again."
          )}
          icon={UserIcon}
          title="Client unavailable"
        />
      </Screen>
    );
  }

  if (mode === "edit" && !clientQuery.data) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            label: "Back to clients",
            onPress: () =>
              router.replace("/directory?section=clients" as never)
          }}
          description="This client may have been removed or you may not have access."
          icon={UserIcon}
          title="Client not found"
        />
      </Screen>
    );
  }

  const existingClient = clientQuery.data;

  if (
    mode === "edit" &&
    existingClient &&
    user?.role !== "admin" &&
    user?.id !== existingClient.owner_id
  ) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            label: "Back to client",
            onPress: () =>
              router.replace(`/clients/${existingClient.id}` as never)
          }}
          description="You don't have permission to edit this client."
          icon={UserIcon}
          title="Client editing unavailable"
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
                onPress: () =>
                  router.replace(`/clients/${clientId}` as never)
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
  );
}

function toFormValues(client: Client): ClientFormValues {
  return {
    email: client.email ?? "",
    first_name: client.first_name,
    last_name: client.last_name ?? "",
    phone_number: client.phone_number ?? ""
  };
}
