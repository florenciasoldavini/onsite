import { ClientFormFields } from "@/features/clients/components/client-form-fields";
import {
  createClientFormSchema,
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
import { CatalogPickerField } from "@/shared/ui/components/catalog-picker-field";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import { PlusIcon, UserIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

const quickClientDefaults: ClientFormValues = {
  email: "",
  first_name: "",
  last_name: "",
  phone_number: ""
};

export function ClientPickerField({
  disabled = false,
  onChange,
  ownerId,
  value
}: {
  disabled?: boolean;
  onChange: (clientId: string | null) => void;
  ownerId?: string;
  value: string | null;
}) {
  const { user } = useAuth();
  const { t } = useTranslation("features/clients");
  const effectiveOwnerId = ownerId ?? user?.id;
  const [query, setQuery] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const clientsQuery = useClients({
    ownerId: effectiveOwnerId,
    query,
    sort: "name_asc"
  });
  const selectedClientQuery = useClient(value ?? undefined);
  const canQuickCreate = Boolean(user) && (!ownerId || ownerId === user?.id);

  return (
    <>
      <CatalogPickerField
        disabled={disabled}
        entityName={t(($) => $["features/clients"].picker.entity)}
        entityNamePlural={t(($) => $["features/clients"].picker.entities)}
        footer={
          canQuickCreate ? (
            <AppButton
              color="neutral"
              fullWidth={false}
              icon={PlusIcon}
              iconAfter={false}
              onPress={() => setQuickCreateOpen(true)}
              size="sm"
              variant="bordered"
            >
              {t(($) => $["features/clients"].picker.quickCreate)}
            </AppButton>
          ) : null
        }
        getDisplayName={getClientDisplayName}
        hasNextPage={clientsQuery.hasNextPage}
        icon={UserIcon}
        isError={clientsQuery.isError}
        isFetchingNextPage={clientsQuery.isFetchingNextPage}
        isLoading={clientsQuery.isLoading}
        label={t(($) => $["features/clients"].picker.label)}
        onChange={onChange}
        onLoadMore={() => void clientsQuery.fetchNextPage()}
        onQueryChange={setQuery}
        pages={clientsQuery.data?.pages}
        query={query}
        selectedItemFallback={selectedClientQuery.data}
        value={value}
      />
      <QuickCreateClientModal
        onClose={() => setQuickCreateOpen(false)}
        onCreated={(client) => {
          onChange(client.id);
          setQuickCreateOpen(false);
        }}
        visible={quickCreateOpen}
      />
    </>
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
  const { t } = useTranslation("features/clients");
  const { i18n, t: tShared } = useTranslation("shared");
  const [formError, setFormError] = useState<string | null>(null);
  const formSchema = useMemo(
    () => createClientFormSchema(tShared),
    [i18n.resolvedLanguage, tShared]
  );
  const form = useForm<ClientFormValues>({
    defaultValues: quickClientDefaults,
    mode: "onChange",
    resolver: zodResolver(formSchema)
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
          t(($) => $["features/clients"].errors.create)
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
          accessibilityLabel={t(
            ($) => $["features/clients"].accessibility.closeQuickCreate
          )}
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
              <AppHeading variant="section">
                {t(($) => $["features/clients"].form.createTitle)}
              </AppHeading>
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
                  {tShared(($) => $.shared.actions.cancel)}
                </AppButton>
                <AppButton
                  isDisabled={!isValid}
                  loading={createMutation.isPending}
                  onPress={() => void submit()}
                  size="md"
                >
                  {t(($) => $["features/clients"].actions.create)}
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
