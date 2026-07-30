import { getCategoryLabel } from "@/features/documents/components/document-card";
import { PROJECT_DOCUMENT_CATEGORIES } from "@/features/documents/constants/document.constants";
import { createDocumentFormSchema } from "@/features/documents/schemas/document.schema";
import type {
  DocumentFormValues,
  ProjectDocument
} from "@/features/documents/types/document";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { TextField } from "@/shared/ui/components/input";
import { SelectField } from "@/shared/ui/components/select-field";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, View } from "react-native";

export function DocumentEditDialog({
  document,
  error,
  isPending,
  onClose,
  onSave
}: {
  document: ProjectDocument | null;
  error: string | null;
  isPending: boolean;
  onClose: () => void;
  onSave: (values: DocumentFormValues) => void | Promise<void>;
}) {
  const { i18n, t } = useTranslation("features/documents");
  const { t: tShared } = useTranslation("shared");
  const schema = useMemo(
    () => createDocumentFormSchema(t),
    [i18n.resolvedLanguage, t]
  );
  const form = useForm<DocumentFormValues>({
    defaultValues: { category: "other", name: "" },
    mode: "onChange",
    resolver: zodResolver(schema)
  });
  const categoryOptions = PROJECT_DOCUMENT_CATEGORIES.map((category) => ({
    label: getCategoryLabel(category, t),
    value: category
  }));

  useEffect(() => {
    if (document) {
      form.reset({ category: document.category, name: document.name });
    }
  }, [document, form]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {
        if (!isPending) onClose();
      }}
      transparent
      visible={Boolean(document)}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel={t(
            ($) => $["features/documents"].accessibility.closeEdit
          )}
          disabled={isPending}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.backdrop} />
        <AppCard padding="lg" style={styles.card}>
          <View style={{ gap: atomSpacing[5] }}>
            <AppHeading variant="section">
              {t(($) => $["features/documents"].edit.title)}
            </AppHeading>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  editable={!isPending}
                  errorText={fieldState.error?.message}
                  label={t(($) => $["features/documents"].edit.name)}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  required
                  value={field.value}
                />
              )}
            />
            <Controller
              control={form.control}
              name="category"
              render={({ field, fieldState }) => (
                <SelectField
                  disabled={isPending}
                  errorText={fieldState.error?.message}
                  label={t(($) => $["features/documents"].edit.category)}
                  onChange={field.onChange}
                  options={categoryOptions}
                  required
                  value={field.value}
                />
              )}
            />
            {error ? (
              <AppText selectable tone="danger">
                {error}
              </AppText>
            ) : null}
            <View style={styles.actions}>
              <AppButton
                color="neutral"
                fullWidth={false}
                isDisabled={isPending}
                onPress={onClose}
                size="md"
                variant="bordered"
              >
                {tShared(($) => $.shared.actions.cancel)}
              </AppButton>
              <AppButton
                fullWidth={false}
                isDisabled={!form.formState.isValid || isPending}
                loading={isPending}
                onPress={() => void form.handleSubmit(onSave)()}
                size="md"
              >
                {t(($) => $["features/documents"].actions.save)}
              </AppButton>
            </View>
          </View>
        </AppCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: atomSpacing[3],
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.5)"
  },
  card: { maxWidth: 640, width: "100%" },
  root: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: atomSpacing[5]
  }
});
