import { ClientFormFields } from "@/features/clients/components/client-form-fields";
import {
  clientFormSchema,
  getClientDisplayName,
  toClientInput
} from "@/features/clients/schemas/client.schema";
import {
  useClient,
  useClients,
  useCreateClient
} from "@/features/clients/hooks/use-clients";
import type {
  ClientFormValues,
  ClientSummary
} from "@/features/clients/types/client";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { SearchField } from "@/shared/ui/components/input";
import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { PlusIcon, UserIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

const quickClientDefaults: ClientFormValues = {
  email: "",
  first_name: "",
  last_name: "",
  phone_number: ""
};

export function ClientPickerField({
  onChange,
  ownerId,
  value
}: {
  onChange: (clientId: string | null) => void;
  ownerId?: string;
  value: string | null;
}) {
  const { user } = useAuth();
  const effectiveOwnerId = ownerId ?? user?.id;
  const [query, setQuery] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const clientsQuery = useClients({
    ownerId: effectiveOwnerId,
    query,
    sort: "name_asc"
  });
  const clients = useMemo(
    () => clientsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [clientsQuery.data]
  );
  const selectedClientQuery = useClient(value ?? undefined);
  const selectedClient =
    clients.find((client) => client.id === value) ??
    selectedClientQuery.data ??
    null;
  const canQuickCreate = Boolean(user) && (!ownerId || ownerId === user?.id);

  return (
    <View style={{ gap: atomSpacing[3] }}>
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between"
        }}
      >
        <AppText variant="label">Client</AppText>
        <AppText tone="subtle" variant="meta">
          (optional)
        </AppText>
      </View>
      {selectedClient ? (
        <SelectedClient
          client={selectedClient}
          onClear={() => onChange(null)}
        />
      ) : null}
      <SearchField
        onChangeText={setQuery}
        placeholder="Search by name, phone, or email"
        size="md"
        value={query}
      />
      <AppCard padding="sm" tone="muted">
        <View style={{ gap: atomSpacing[2] }}>
          {clientsQuery.isLoading ? (
            <AppText tone="muted">Loading clients…</AppText>
          ) : clientsQuery.isError ? (
            <AppText tone="danger">
              We couldn&apos;t load clients. Try again.
            </AppText>
          ) : clients.length === 0 ? (
            <AppText tone="muted">No matching clients.</AppText>
          ) : (
            clients.map((client) => (
              <Pressable
                accessibilityRole="button"
                key={client.id}
                onPress={() => onChange(client.id)}
                style={({ pressed }) => ({
                  backgroundColor:
                    value === client.id
                      ? `${atomPalette.accent}12`
                      : atomPalette.surface,
                  borderRadius: atomRadii.md,
                  opacity: pressed ? 0.78 : 1,
                  padding: atomSpacing[3]
                })}
              >
                <AppText variant="label">
                  {getClientDisplayName(client)}
                </AppText>
                {client.phone_number || client.email ? (
                  <AppText tone="muted" variant="bodySm">
                    {[client.phone_number, client.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </AppText>
                ) : null}
              </Pressable>
            ))
          )}
          {clientsQuery.hasNextPage ? (
            <AppButton
              color="neutral"
              loading={clientsQuery.isFetchingNextPage}
              onPress={() => void clientsQuery.fetchNextPage()}
              size="sm"
              variant="ghost"
            >
              Load more clients
            </AppButton>
          ) : null}
        </View>
      </AppCard>
      {canQuickCreate ? (
        <AppButton
          color="neutral"
          fullWidth={false}
          icon={PlusIcon}
          iconAfter={false}
          onPress={() => setQuickCreateOpen(true)}
          size="sm"
          variant="bordered"
        >
          Quick-create client
        </AppButton>
      ) : null}
      <QuickCreateClientModal
        onClose={() => setQuickCreateOpen(false)}
        onCreated={(client) => {
          onChange(client.id);
          setQuickCreateOpen(false);
        }}
        visible={quickCreateOpen}
      />
    </View>
  );
}

function SelectedClient({
  client,
  onClear
}: {
  client: ClientSummary;
  onClear: () => void;
}) {
  return (
    <AppCard padding="sm">
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          gap: atomSpacing[3]
        }}
      >
        <UserIcon color={atomPalette.accent} size="md" />
        <View style={{ flex: 1 }}>
          <AppText variant="label">{getClientDisplayName(client)}</AppText>
          <AppText tone="muted" variant="bodySm">
            {[client.phone_number, client.email].filter(Boolean).join(" · ") ||
              "No contact details"}
          </AppText>
        </View>
        <AppButton
          color="neutral"
          fullWidth={false}
          onPress={onClear}
          size="sm"
          variant="ghost"
        >
          Clear
        </AppButton>
      </View>
    </AppCard>
  );
}

function QuickCreateClientModal({
  onClose,
  onCreated,
  visible
}: {
  onClose: () => void;
  onCreated: (client: ClientSummary) => void;
  visible: boolean;
}) {
  const createMutation = useCreateClient();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ClientFormValues>({
    defaultValues: quickClientDefaults,
    mode: "onChange",
    resolver: zodResolver(clientFormSchema)
  });
  const {
    control,
    formState: { isValid },
    handleSubmit,
    reset
  } = form;
  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const client = await createMutation.mutateAsync(toClientInput(values));
      reset(quickClientDefaults);
      onCreated(client);
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          "We couldn't create this client. Try again."
        )
      );
    }
  });

  const close = () => {
    if (!createMutation.isPending) {
      setFormError(null);
      reset(quickClientDefaults);
      onClose();
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={close}
      transparent
      visible={visible}
    >
      <View style={pickerStyles.modalRoot}>
        <Pressable
          accessibilityLabel="Close quick-create client"
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={pickerStyles.backdrop} />
        <AppCard padding="lg" style={pickerStyles.modalCard}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: atomSpacing[5] }}>
              <AppHeading variant="section">New client</AppHeading>
              <ClientFormFields
                control={control}
                onChange={() => setFormError(null)}
              />
              {formError ? <AppText tone="danger">{formError}</AppText> : null}
              <View style={pickerStyles.actions}>
                <AppButton
                  color="neutral"
                  isDisabled={createMutation.isPending}
                  onPress={close}
                  size="md"
                  variant="bordered"
                >
                  Cancel
                </AppButton>
                <AppButton
                  isDisabled={!isValid}
                  loading={createMutation.isPending}
                  onPress={() => void submit()}
                  size="md"
                >
                  Create client
                </AppButton>
              </View>
            </View>
          </ScrollView>
        </AppCard>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: atomSpacing[3]
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.42)"
  },
  modalCard: {
    maxHeight: "88%",
    maxWidth: 560,
    width: "100%"
  },
  modalRoot: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: atomSpacing[4]
  }
});
