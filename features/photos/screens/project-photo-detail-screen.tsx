import { PhotoMarketingField } from "@/features/photos/components/photo-marketing-field";
import {
  PROJECT_PHOTO_KIND_LABELS,
  PROJECT_PHOTO_KINDS
} from "@/features/photos/constants/photo.constants";
import {
  useProjectPhoto,
  useSoftDeleteProjectPhoto,
  useUpdateProjectPhoto
} from "@/features/photos/hooks/use-project-photos";
import {
  projectPhotoEditSchema,
  toProjectPhotoUpdateInput
} from "@/features/photos/schemas/photo.schema";
import type { ProjectPhotoKind } from "@/features/photos/types/photo";
import { useProjectPermission } from "@/features/projects/hooks/use-project-collaboration";
import { AppBadge } from "@/shared/ui/components/badge";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import {
  DestructiveConfirmationDialog,
  useDestructiveConfirmation
} from "@/shared/ui/components/destructive-confirmation-dialog";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { AppHeading } from "@/shared/ui/components/heading";
import { Screen } from "@/shared/ui/components/screen";
import { SelectField } from "@/shared/ui/components/select-field";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { TextAreaField } from "@/shared/ui/components/textarea";
import { useAppToast } from "@/shared/ui/components/toast";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import { AlertIcon, RefreshIcon, TrashIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { z } from "zod";

type EditValues = z.infer<typeof projectPhotoEditSchema>;

const kindOptions = PROJECT_PHOTO_KINDS.map((kind) => ({
  label: PROJECT_PHOTO_KIND_LABELS[kind],
  value: kind
}));

export default function ProjectPhotoDetailScreen() {
  const router = useRouter();
  const toast = useAppToast();
  const params = useLocalSearchParams<{
    photoId: string;
    projectId: string;
  }>();
  const photoId = firstParam(params.photoId) ?? "";
  const projectId = firstParam(params.projectId) ?? "";
  const photoQuery = useProjectPhoto(photoId);
  const writePermission = useProjectPermission(
    projectId,
    "project.photos.write"
  );
  const canWrite = writePermission.allowed;
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
    if (photoQuery.data) {
      form.reset({
        caption: photoQuery.data.caption ?? "",
        is_marketing: photoQuery.data.is_marketing,
        kind: photoQuery.data.kind
      });
    }
  }, [form, photoQuery.data]);

  if (photoQuery.isLoading || writePermission.isLoading) {
    return (
      <Screen>
        <View style={{ gap: atomSpacing[5] }}>
          <SkeletonBlock height={24} width="35%" />
          <SkeletonBlock height={420} />
          <SkeletonBlock height={260} />
        </View>
      </Screen>
    );
  }

  if (photoQuery.isError) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void photoQuery.refetch()
          }}
          description={getUserFacingErrorMessage(
            photoQuery.error,
            "We couldn't load this photo. Check your connection and try again."
          )}
          icon={AlertIcon}
          title="Photo unavailable"
        />
      </Screen>
    );
  }

  if (!photoQuery.data || photoQuery.data.project_id !== projectId) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            label: "Back to photos",
            onPress: () =>
              router.replace(`/projects/${projectId}/photos` as never)
          }}
          description="The photo may have been removed or you may not have access."
          icon={AlertIcon}
          title="Photo not found"
        />
      </Screen>
    );
  }

  const photo = photoQuery.data;
  const save = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync(toProjectPhotoUpdateInput(values));
      form.reset(values);
      toast.show({
        title: "Photo details updated",
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
      toast.show({ title: "Photo deleted", tone: "success" });
      router.replace(`/projects/${projectId}/photos` as never);
    } catch (error) {
      deleteConfirmation.setError(
        getUserFacingErrorMessage(
          error,
          "We couldn't delete this photo. Check your connection and try again."
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
              label: "Photos",
              onPress: () =>
                router.replace(`/projects/${projectId}/photos` as never)
            },
            { label: "Photo details" }
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
              PROJECT PHOTO
            </AppText>
            {photo.is_marketing ? (
              <AppBadge tone="accent">Marketing</AppBadge>
            ) : null}
          </View>
          <AppHeading variant="hero">
            {PROJECT_PHOTO_KIND_LABELS[photo.kind]}
          </AppHeading>
        </View>

        <Image
          accessibilityLabel={photo.caption ?? "Full project photo"}
          alt={photo.caption ?? "Full project photo"}
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
            <Metadata label="Captured" value={formatDate(photo.captured_at)} />
            <Metadata
              label="Dimensions"
              value={`${photo.width} × ${photo.height}`}
            />
            <Metadata
              label="Location"
              value={
                photo.latitude === null
                  ? "Not available"
                  : `${photo.latitude.toFixed(5)}, ${photo.longitude?.toFixed(5)} (photo EXIF)`
              }
            />
          </View>
        </AppCard>

        <AppCard padding="md">
          <View style={{ gap: atomSpacing[5] }}>
            <AppHeading variant="section">Photo details</AppHeading>
            <Controller
              control={form.control}
              name="kind"
              render={({ field }) => (
                <SelectField<ProjectPhotoKind>
                  disabled={!canWrite || updateMutation.isPending}
                  errorText={form.formState.errors.kind?.message}
                  label="Category"
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
                  helperText="Add context that will help the team understand the photo."
                  label="Caption (optional)"
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
                  "We couldn't update this photo. Check your connection and try again."
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
                  Save changes
                </AppButton>
                <AppButton
                  color="danger"
                  fullWidth={false}
                  icon={TrashIcon}
                  onPress={deleteConfirmation.open}
                  variant="bordered"
                >
                  Delete photo
                </AppButton>
              </View>
            ) : null}
          </View>
        </AppCard>
      </View>

      {canWrite ? (
        <DestructiveConfirmationDialog
          accessibilityLabel="Cancel deleting photo"
          controller={deleteConfirmation}
          description="This photo will be removed from the project gallery. This action cannot currently be undone in the app."
          isPending={deleteMutation.isPending}
          onConfirm={deletePhoto}
          title="Delete photo?"
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

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleString();
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
