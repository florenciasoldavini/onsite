import {
  formatFileSize,
  getCategoryLabel
} from "@/features/documents/components/document-card";
import { PROJECT_DOCUMENT_CATEGORIES } from "@/features/documents/constants/document.constants";
import { useUploadProjectDocument } from "@/features/documents/hooks/use-project-documents";
import { createDocumentFormSchema } from "@/features/documents/schemas/document.schema";
import type {
  DocumentFormValues,
  DocumentPickerAsset,
  DocumentUploadStage
} from "@/features/documents/types/document";
import { getDocumentDisplayName } from "@/features/documents/utils/document-file";
import {
  getDocumentUploadErrorMessage,
  getDocumentUploadStageLabel
} from "@/features/documents/utils/document-feedback";
import { useProjectPermission } from "@/features/projects/hooks/use-project-collaboration";
import { useProject } from "@/features/projects/hooks/use-projects";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { TextField } from "@/shared/ui/components/input";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SelectField } from "@/shared/ui/components/select-field";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { useAppToast } from "@/shared/ui/components/toast";
import { atomSpacing } from "@/shared/ui/components/theme";
import {
  FileTextIcon,
  RefreshIcon,
  UploadIcon
} from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function ProjectDocumentUploadScreen({
  projectId
}: {
  projectId?: string;
}) {
  const router = useRouter();
  const { i18n, t } = useTranslation("features/documents");
  const { t: tShared } = useTranslation("shared");
  const toast = useAppToast();
  const routeProjectId = projectId ?? "";
  const projectQuery = useProject(projectId);
  const writePermission = useProjectPermission(
    projectId,
    "project.documents.write"
  );
  const uploadMutation = useUploadProjectDocument(routeProjectId);
  const [asset, setAsset] = useState<DocumentPickerAsset | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [stage, setStage] = useState<DocumentUploadStage | null>(null);
  const schema = useMemo(
    () => createDocumentFormSchema(t),
    [i18n.resolvedLanguage, t]
  );
  const form = useForm<DocumentFormValues>({
    defaultValues: { category: undefined, name: "" },
    mode: "onChange",
    resolver: zodResolver(schema)
  });
  const categoryOptions = PROJECT_DOCUMENT_CATEGORIES.map((category) => ({
    label: getCategoryLabel(category, t),
    value: category
  }));
  const isBusy = uploadMutation.isPending;

  const chooseFile = async () => {
    setFileError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ["application/pdf", "image/jpeg", "image/png"]
      });
      if (result.canceled || !result.assets[0]) {
        setStage("cancelled");
        return;
      }

      const selected = result.assets[0];
      const nextAsset: DocumentPickerAsset = {
        file: selected.file ?? null,
        mimeType: selected.mimeType,
        name: selected.name,
        size: selected.size,
        uri: selected.uri
      };
      setAsset(nextAsset);
      form.setValue("name", getDocumentDisplayName(selected.name), {
        shouldDirty: true,
        shouldValidate: true
      });
    } catch (error) {
      setFileError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/documents"].errors.upload)
        )
      );
    }
  };

  const submit = form.handleSubmit(async (values) => {
    if (!asset) return;
    setFileError(null);
    setStage("validating");
    try {
      const outcome = await uploadMutation.mutateAsync({
        asset,
        category: values.category,
        name: values.name.trim(),
        onStageChange: setStage
      });
      toast.show({
        description: t(
          ($) => $["features/documents"].toast.uploadedDescription,
          { name: outcome.document.name }
        ),
        title: t(($) => $["features/documents"].toast.uploadedTitle),
        tone: "success"
      });
      router.replace(`/projects/${routeProjectId}/documents` as never);
    } catch (error) {
      setStage("failed");
      setFileError(getDocumentUploadErrorMessage(error, t));
    }
  });

  const backToDocuments = {
    label: t(($) => $["features/documents"].actions.backProject),
    onPress: () =>
      router.replace(`/projects/${routeProjectId}/documents` as never)
  };
  const forbidden =
    !writePermission.isLoading &&
    !writePermission.isError &&
    !writePermission.allowed;

  return (
    <RouteStateBoundary
      feedback={{
        forbidden: { action: backToDocuments, icon: FileTextIcon },
        invalidParams: {
          action: {
            label: t(($) => $["features/documents"].actions.backProjects),
            onPress: () => router.replace("/projects" as never)
          },
          icon: FileTextIcon
        },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: tShared(($) => $.shared.actions.retry),
            onPress: () =>
              void Promise.all([
                projectQuery.refetch(),
                writePermission.refetch()
              ])
          },
          description: getUserFacingErrorMessage(
            projectQuery.error ?? writePermission.error,
            t(($) => $["features/documents"].errors.uploadAccess)
          ),
          icon: FileTextIcon
        },
        notFound: { action: backToDocuments, icon: FileTextIcon }
      }}
      isError={projectQuery.isError || writePermission.isError}
      isForbidden={forbidden}
      isInvalid={!projectId}
      isLoading={projectQuery.isLoading || writePermission.isLoading}
      isNotFound={!projectQuery.data}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={44} width="55%" />
            <SkeletonBlock height={480} />
          </View>
        </Screen>
      }
      resourceName="project"
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
            items={[
              {
                label: t(($) => $["features/documents"].list.project),
                onPress: () => router.replace("/projects" as never)
              },
              {
                label:
                  projectQuery.data?.name ??
                  t(($) => $["features/documents"].list.project),
                onPress: () =>
                  router.replace(`/projects/${routeProjectId}` as never)
              },
              {
                label: t(($) => $["features/documents"].list.title),
                onPress: () =>
                  router.replace(
                    `/projects/${routeProjectId}/documents` as never
                  )
              },
              {
                label: t(($) => $["features/documents"].upload.title)
              }
            ]}
          />
          <View style={{ gap: atomSpacing[2] }}>
            <AppHeading variant="hero">
              {t(($) => $["features/documents"].upload.title)}
            </AppHeading>
            <AppText tone="muted">
              {t(($) => $["features/documents"].upload.description)}
            </AppText>
          </View>

          <AppCard padding="lg">
            <View style={{ gap: atomSpacing[5] }}>
              <View style={{ gap: atomSpacing[2] }}>
                <AppText variant="label">
                  {t(($) => $["features/documents"].upload.file)}
                </AppText>
                <AppButton
                  color="neutral"
                  icon={FileTextIcon}
                  iconAfter={false}
                  isDisabled={isBusy}
                  onPress={() => void chooseFile()}
                  variant="bordered"
                >
                  {t(($) => $["features/documents"].actions.chooseFile)}
                </AppButton>
                <AppText tone="muted" variant="bodySm">
                  {asset
                    ? t(
                        ($) =>
                          $["features/documents"].upload.selectedFile,
                        {
                          name: asset.name,
                          size: formatFileSize(asset.size ?? 0)
                        }
                      )
                    : t(($) => $["features/documents"].upload.noFile)}
                </AppText>
                <AppText tone="subtle" variant="meta">
                  {t(($) => $["features/documents"].upload.fileHelper)}
                </AppText>
              </View>

              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <TextField
                    editable={!isBusy}
                    errorText={fieldState.error?.message}
                    label={t(($) => $["features/documents"].upload.name)}
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
                    disabled={isBusy}
                    errorText={fieldState.error?.message}
                    label={t(
                      ($) => $["features/documents"].upload.category
                    )}
                    onChange={field.onChange}
                    options={categoryOptions}
                    required
                    value={field.value}
                  />
                )}
              />

              {stage ? (
                <AppText
                  tone={stage === "failed" ? "danger" : "accent"}
                  variant="bodySm"
                >
                  {getDocumentUploadStageLabel(stage, t)}
                </AppText>
              ) : null}
              {fileError ? (
                <AppText selectable tone="danger">
                  {fileError}
                </AppText>
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: atomSpacing[3],
                  justifyContent: "flex-end"
                }}
              >
                <AppButton
                  color="neutral"
                  fullWidth={false}
                  isDisabled={isBusy}
                  onPress={backToDocuments.onPress}
                  size="md"
                  variant="bordered"
                >
                  {t(($) => $["features/documents"].actions.backProject)}
                </AppButton>
                <AppButton
                  fullWidth={false}
                  icon={UploadIcon}
                  iconAfter={false}
                  isDisabled={!asset || !form.formState.isValid || isBusy}
                  loading={isBusy}
                  onPress={() => void submit()}
                  size="md"
                >
                  {t(($) => $["features/documents"].actions.upload)}
                </AppButton>
              </View>
            </View>
          </AppCard>
        </View>
      </Screen>
    </RouteStateBoundary>
  );
}
