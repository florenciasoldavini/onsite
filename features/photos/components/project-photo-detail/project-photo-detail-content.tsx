import { PhotoMarketingField } from "@/features/photos/components/photo-marketing-field";
import {
  PROJECT_PHOTO_KIND_LABELS_BY_LANGUAGE,
  PROJECT_PHOTO_KINDS
} from "@/features/photos/constants/photo.constants";
import {
  useSoftDeleteProjectPhoto,
  useUpdateProjectPhoto
} from "@/features/photos/hooks/use-project-photos";
import {
  projectPhotoEditSchema,
  toProjectPhotoUpdateInput
} from "@/features/photos/schemas/photo.schema";
import type {
  ProjectPhoto,
  ProjectPhotoKind
} from "@/features/photos/types/photo";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import { AppBadge } from "@/shared/ui/components/badge";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import {
  DestructiveConfirmationDialog,
  useDestructiveConfirmation
} from "@/shared/ui/components/destructive-confirmation-dialog";
import { AppHeading } from "@/shared/ui/components/heading";
import { Screen } from "@/shared/ui/components/screen";
import { SelectField } from "@/shared/ui/components/select-field";
import { AppText } from "@/shared/ui/components/text";
import { TextAreaField } from "@/shared/ui/components/textarea";
import { useAppToast } from "@/shared/ui/components/toast";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import { TrashIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { z } from "zod";

type EditValues = z.infer<typeof projectPhotoEditSchema>;

export function ProjectPhotoDetailContent({
  canWrite,
  photo,
  photoId,
  projectId
}: {
  canWrite: boolean;
  photo: ProjectPhoto;
  photoId: string;
  projectId: string;
}) {
  const router = useRouter();
  const { formattingLocale, language } = useLocalization();
  const { t } = useTranslation("features/photos");
  const kindOptions = PROJECT_PHOTO_KINDS.map((kind) => ({
    label: PROJECT_PHOTO_KIND_LABELS_BY_LANGUAGE[language][kind],
    value: kind
  }));
  const toast = useAppToast();
  const updateMutation = useUpdateProjectPhoto(photoId);
  const deleteMutation = useSoftDeleteProjectPhoto();
  const deleteConfirmation = useDestructiveConfirmation();
  const form = useForm<EditValues>({
    defaultValues: {
      caption: "",
      is_marketing: false,
      kind: "general"
    },
    resolver: zodResolver(projectPhotoEditSchema)
  });

  useEffect(() => {
    form.reset({
      caption: photo.caption ?? "",
      is_marketing: photo.is_marketing,
      kind: photo.kind
    });
  }, [form, photo]);

  const save = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync(toProjectPhotoUpdateInput(values));
      form.reset(values);
      toast.show({
        title: t(($) => $["features/photos"].detail.updatedTitle),
        tone: "success"
      });
    } catch {
      // The mutation state renders the action-specific error.
    }
  });
  const deletePhoto = async () => {
    deleteConfirmation.clearError();

    try {
      await deleteMutation.mutateAsync(photoId);
      deleteConfirmation.close();
      toast.show({
        title: t(($) => $["features/photos"].detail.deletedTitle),
        tone: "success"
      });
      router.replace(`/projects/${projectId}/photos` as never);
    } catch (error) {
      deleteConfirmation.setError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/photos"].errors.delete)
        )
      );
    }
  };

  return (
    <Screen keyboardSafe>
      <View style={{ gap: atomSpacing[6] }}>
        <Breadcrumb
          items={[
            {
              label: t(($) => $["features/photos"].gallery.title),
              onPress: () =>
                router.replace(`/projects/${projectId}/photos` as never)
            },
            { label: t(($) => $["features/photos"].detail.photoDetails) }
          ]}
        />

        <View style={{ gap: atomSpacing[2] }}>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: atomSpacing[2]
            }}
          >
            <AppText tone="accent" variant="eyebrow">
              {t(($) => $["features/photos"].detail.eyebrow)}
            </AppText>
            {photo.is_marketing ? (
              <AppBadge tone="accent">
                {t(($) => $["features/photos"].gallery.marketing)}
              </AppBadge>
            ) : null}
          </View>
          <AppHeading variant="hero">
            {PROJECT_PHOTO_KIND_LABELS_BY_LANGUAGE[language][photo.kind]}
          </AppHeading>
        </View>

        <Image
          accessibilityLabel={
            photo.caption ??
            t(($) => $["features/photos"].accessibility.fullPhoto)
          }
          alt={
            photo.caption ??
            t(($) => $["features/photos"].accessibility.fullPhoto)
          }
          contentFit="contain"
          source={photo.full_url ? { uri: photo.full_url } : undefined}
          style={{
            aspectRatio: photo.width / photo.height,
            backgroundColor: atomPalette.surfaceLow,
            borderRadius: 16,
            maxHeight: 720,
            width: "100%"
          }}
          transition={160}
        />

        <AppCard padding="md" tone="muted">
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: atomSpacing[5]
            }}
          >
            <Metadata
              label={t(($) => $["features/photos"].detail.captured)}
              value={formatDate(
                photo.captured_at,
                formattingLocale,
                t(($) => $["features/photos"].detail.unavailable)
              )}
            />
            <Metadata
              label={t(($) => $["features/photos"].detail.dimensions)}
              value={`${photo.width} × ${photo.height}`}
            />
            <Metadata
              label={t(($) => $["features/photos"].detail.location)}
              value={
                photo.latitude === null
                  ? t(($) => $["features/photos"].detail.notAvailable)
                  : t(($) => $["features/photos"].detail.locationExif, {
                      latitude: photo.latitude.toFixed(5),
                      longitude: photo.longitude?.toFixed(5) ?? ""
                    })
              }
            />
          </View>
        </AppCard>

        <AppCard padding="md">
          <View style={{ gap: atomSpacing[5] }}>
            <AppHeading variant="section">
              {t(($) => $["features/photos"].detail.photoDetails)}
            </AppHeading>
            <Controller
              control={form.control}
              name="kind"
              render={({ field }) => (
                <SelectField<ProjectPhotoKind>
                  disabled={!canWrite || updateMutation.isPending}
                  errorText={form.formState.errors.kind?.message}
                  label={t(($) => $["features/photos"].detail.category)}
                  onChange={field.onChange}
                  options={kindOptions}
                  value={field.value}
                />
              )}
            />
            <Controller
              control={form.control}
              name="caption"
              render={({ field }) => (
                <TextAreaField
                  editable={canWrite && !updateMutation.isPending}
                  errorText={form.formState.errors.caption?.message}
                  helperText={t(
                    ($) => $["features/photos"].detail.captionHelper
                  )}
                  label={t(($) => $["features/photos"].detail.caption)}
                  maxLength={1000}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  value={field.value}
                />
              )}
            />
            <Controller
              control={form.control}
              name="is_marketing"
              render={({ field }) => (
                <PhotoMarketingField
                  disabled={!canWrite || updateMutation.isPending}
                  onChange={field.onChange}
                  value={field.value}
                />
              )}
            />
            {updateMutation.isError ? (
              <AppText selectable tone="danger">
                {getUserFacingErrorMessage(
                  updateMutation.error,
                  t(($) => $["features/photos"].errors.update)
                )}
              </AppText>
            ) : null}
            {canWrite ? (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: atomSpacing[3]
                }}
              >
                <AppButton
                  fullWidth={false}
                  isDisabled={!form.formState.isDirty}
                  loading={updateMutation.isPending}
                  onPress={() => void save()}
                >
                  {t(($) => $["features/photos"].actions.save)}
                </AppButton>
                <AppButton
                  color="danger"
                  fullWidth={false}
                  icon={TrashIcon}
                  onPress={deleteConfirmation.open}
                  variant="bordered"
                >
                  {t(($) => $["features/photos"].actions.delete)}
                </AppButton>
              </View>
            ) : null}
          </View>
        </AppCard>
      </View>

      {canWrite ? (
        <DestructiveConfirmationDialog
          accessibilityLabel={t(
            ($) => $["features/photos"].detail.cancelDelete
          )}
          controller={deleteConfirmation}
          description={t(
            ($) => $["features/photos"].detail.deleteDescription
          )}
          isPending={deleteMutation.isPending}
          onConfirm={deletePhoto}
          title={t(($) => $["features/photos"].detail.deleteTitle)}
        />
      ) : null}
    </Screen>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexBasis: 180, flexGrow: 1, gap: atomSpacing[1] }}>
      <AppText tone="subtle" variant="meta">
        {label.toUpperCase()}
      </AppText>
      <AppText selectable variant="bodySm">
        {value}
      </AppText>
    </View>
  );
}

function formatDate(value: string, locale: string, fallback: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback
    : new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(date);
}
