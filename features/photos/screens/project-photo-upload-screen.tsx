import { ProjectPhotoDraftCard } from "@/features/photos/components/project-photo-draft-card";
import {
  PROJECT_PHOTO_BATCH_LIMIT,
  PROJECT_PHOTO_KIND_LABELS,
  PROJECT_PHOTO_KINDS
} from "@/features/photos/constants/photo.constants";
import { useUploadProjectPhotos } from "@/features/photos/hooks/use-project-photos";
import {
  projectPhotoBatchFormSchema
} from "@/features/photos/schemas/photo.schema";
import type { ProjectPhotoDraft } from "@/features/photos/types/photo";
import type { ProjectPhotoUploadStage } from "@/features/photos/services/photos.service";
import { useProject } from "@/features/projects/hooks/use-projects";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppCard } from "@/shared/ui/components/card";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { AppHeading } from "@/shared/ui/components/heading";
import { Screen } from "@/shared/ui/components/screen";
import { SelectField } from "@/shared/ui/components/select-field";
import { AppText } from "@/shared/ui/components/text";
import { useAppToast } from "@/shared/ui/components/toast";
import { atomSpacing } from "@/shared/ui/components/theme";
import {
  CameraIcon,
  AlertIcon,
  ImagePlusIcon,
  RefreshIcon
} from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Platform,
  View
} from "react-native";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver
} from "react-hook-form";

type FormValues = { photos: ProjectPhotoDraft[] };

const kindOptions = PROJECT_PHOTO_KINDS.map((kind) => ({
  label: PROJECT_PHOTO_KIND_LABELS[kind],
  value: kind
}));

export default function ProjectPhotoUploadScreen() {
  const router = useRouter();
  const toast = useAppToast();
  const params = useLocalSearchParams<{ projectId: string }>();
  const projectId = firstParam(params.projectId) ?? "";
  const projectQuery = useProject(projectId);
  const uploadMutation = useUploadProjectPhotos(projectId);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchKind, setBatchKind] =
    useState<ProjectPhotoDraft["kind"]>("general");
  const [stages, setStages] = useState<Record<string, ProjectPhotoUploadStage>>(
    {}
  );
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const form = useForm<FormValues>({
    defaultValues: { photos: [] },
    resolver: zodResolver(
      projectPhotoBatchFormSchema
    ) as Resolver<FormValues>
  });
  const photos = useWatch({ control: form.control, name: "photos" }) ?? [];
  const fieldArray = useFieldArray({
    control: form.control,
    keyName: "fieldKey",
    name: "photos"
  });
  const isBusy = uploadMutation.isPending;
  const remaining = PROJECT_PHOTO_BATCH_LIMIT - photos.length;
  const targetIndexes = useMemo(() => {
    if (selectedIds.size === 0) {
      return photos.map((_, index) => index);
    }

    return photos.flatMap((photo, index) =>
      selectedIds.has(photo.id) ? [index] : []
    );
  }, [photos, selectedIds]);

  if (projectQuery.isError) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void projectQuery.refetch()
          }}
          description={getUserFacingErrorMessage(
            projectQuery.error,
            "We couldn't load this project. Check your connection and try again."
          )}
          icon={AlertIcon}
          title="Project unavailable"
        />
      </Screen>
    );
  }

  if (!projectQuery.isLoading && !projectQuery.data) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            label: "Back to projects",
            onPress: () => router.replace("/projects" as never)
          }}
          description="This project may have been removed or you may not have access."
          icon={AlertIcon}
          title="Project not found"
        />
      </Screen>
    );
  }

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    const accepted = assets.slice(0, remaining);
    fieldArray.append(
      accepted.map((asset) => ({
        asset: {
          exif: asset.exif,
          file: asset.file,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          height: asset.height,
          mimeType: asset.mimeType,
          uri: asset.uri,
          width: asset.width
        },
        caption: "",
        id: createPhotoId(),
        is_marketing: false,
        kind: "general" as const
      }))
    );

    if (assets.length > accepted.length) {
      toast.show({
        description: `Only ${remaining} more photo${remaining === 1 ? "" : "s"} could be added.`,
        title: "20-photo limit reached",
        tone: "warning"
      });
    }
  };

  const chooseFromLibrary = async () => {
    if (remaining <= 0) {
      return;
    }

    setPickerError(null);

    try {
      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          setPickerError(
            permission.canAskAgain
              ? "Photo access is required to select project photos. Allow access and try again."
              : "Photo access is disabled. Enable Photos access for Onzait in your device settings, then try again."
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        exif: true,
        mediaTypes: ["images"],
        orderedSelection: true,
        quality: 1,
        selectionLimit: remaining
      });

      if (!result.canceled) {
        addAssets(result.assets);
      }
    } catch (error) {
      setPickerError(
        getUserFacingErrorMessage(
          error,
          "We couldn't open your photo library. Try again."
        )
      );
    }
  };

  const takePhoto = async () => {
    if (remaining <= 0) {
      return;
    }

    setPickerError(null);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        setPickerError(
          permission.canAskAgain
            ? "Camera access is required to take a project photo. Allow access and try again."
            : "Camera access is disabled. Enable Camera access for Onzait in your device settings, then try again."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        exif: true,
        mediaTypes: ["images"],
        quality: 1
      });

      if (!result.canceled && result.assets[0]) {
        addAssets([result.assets[0]]);
      }
    } catch (error) {
      setPickerError(
        getUserFacingErrorMessage(
          error,
          "We couldn't open the camera. Try again."
        )
      );
    }
  };

  const submit = form.handleSubmit(async (values) => {
    setPickerError(null);
    setItemErrors({});
    setStages((current) => ({
      ...current,
      ...Object.fromEntries(
        values.photos
          .filter((photo) => current[photo.id] === "failed")
          .map((photo) => [photo.id, "retrying" as const])
      )
    }));
    let outcomes;

    try {
      outcomes = await uploadMutation.mutateAsync({
        drafts: values.photos,
        onStageChange: (photoId, stage) => {
          setStages((current) => ({ ...current, [photoId]: stage }));
        }
      });
    } catch {
      return;
    }
    const savedIds = new Set(
      outcomes
        .filter((outcome) => outcome.status === "saved")
        .map((outcome) => outcome.photoId)
    );
    const failures = outcomes.filter((outcome) => outcome.status === "failed");

    if (failures.length > 0) {
      setItemErrors(
        Object.fromEntries(
          failures.map((outcome) => [
            outcome.photoId,
            getUserFacingErrorMessage(
              outcome.error,
              "This photo could not be uploaded. Check your connection and retry."
            )
          ])
        )
      );
      const remainingPhotos = values.photos.filter(
        (photo) => !savedIds.has(photo.id)
      );
      form.reset({ photos: remainingPhotos });
      setSelectedIds(new Set());
      setStages(
        Object.fromEntries(
          remainingPhotos.map((photo) => [photo.id, "failed" as const])
        )
      );
      toast.show({
        description: `${savedIds.size} saved. ${failures.length} remain in the review queue.`,
        title: "Some photos need another try",
        tone: "warning"
      });
      return;
    }

    toast.show({
      description: `${savedIds.size} photo${savedIds.size === 1 ? "" : "s"} added to the project.`,
      title: "Photos saved",
      tone: "success"
    });
    router.replace(`/projects/${projectId}/photos` as never);
  });

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
            { label: "Add photos" }
          ]}
        />
        <View style={{ gap: atomSpacing[2] }}>
          <AppText tone="accent" variant="eyebrow">
            FIXED PROJECT
          </AppText>
          <AppHeading selectable variant="hero">
            {projectQuery.data?.name ?? "Project photos"}
          </AppHeading>
          <AppText tone="muted">
            Every photo in this batch will be saved to this project.
          </AppText>
        </View>

        <AppCard padding="md" tone="muted">
          <View style={{ gap: atomSpacing[4] }}>
            <AppHeading variant="section">
              Add photos ({photos.length}/{PROJECT_PHOTO_BATCH_LIMIT})
            </AppHeading>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: atomSpacing[3]
              }}
            >
              <AppButton
                fullWidth={false}
                icon={ImagePlusIcon}
                isDisabled={isBusy || remaining <= 0}
                onPress={() => void chooseFromLibrary()}
                variant="bordered"
              >
                Photo library
              </AppButton>
              <AppButton
                fullWidth={false}
                icon={CameraIcon}
                isDisabled={isBusy || remaining <= 0}
                onPress={() => void takePhoto()}
                variant="bordered"
              >
                Camera
              </AppButton>
            </View>
            {pickerError ? (
              <AppText selectable tone="danger" variant="bodySm">
                {pickerError}
              </AppText>
            ) : null}
          </View>
        </AppCard>

        {photos.length > 0 ? (
          <AppCard padding="md">
            <View style={{ gap: atomSpacing[4] }}>
              <View style={{ gap: atomSpacing[1] }}>
                <AppHeading variant="section">Batch changes</AppHeading>
                <AppText tone="muted" variant="bodySm">
                  {selectedIds.size > 0
                    ? `Applies to ${selectedIds.size} selected photo${selectedIds.size === 1 ? "" : "s"}.`
                    : "No photos selected, so changes apply to all photos."}
                </AppText>
              </View>
              <SelectField
                disabled={isBusy}
                label="Category"
                onChange={setBatchKind}
                options={kindOptions}
                value={batchKind}
              />
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: atomSpacing[2]
                }}
              >
                <AppButton
                  fullWidth={false}
                  isDisabled={isBusy}
                  onPress={() =>
                    targetIndexes.forEach((index) =>
                      form.setValue(`photos.${index}.kind`, batchKind, {
                        shouldDirty: true,
                        shouldValidate: true
                      })
                    )
                  }
                  size="sm"
                  variant="bordered"
                >
                  Apply category
                </AppButton>
                <AppButton
                  fullWidth={false}
                  isDisabled={isBusy}
                  onPress={() =>
                    targetIndexes.forEach((index) =>
                      form.setValue(`photos.${index}.is_marketing`, true, {
                        shouldDirty: true
                      })
                    )
                  }
                  size="sm"
                  variant="bordered"
                >
                  Mark marketing
                </AppButton>
                <AppButton
                  color="neutral"
                  fullWidth={false}
                  isDisabled={isBusy}
                  onPress={() =>
                    targetIndexes.forEach((index) =>
                      form.setValue(`photos.${index}.is_marketing`, false, {
                        shouldDirty: true
                      })
                    )
                  }
                  size="sm"
                  variant="ghost"
                >
                  Clear marketing
                </AppButton>
              </View>
            </View>
          </AppCard>
        ) : null}

        {photos.map((photo, index) => (
          <ProjectPhotoDraftCard
            control={form.control}
            disabled={isBusy}
            error={itemErrors[photo.id]}
            errors={form.formState.errors.photos?.[index] ?? {}}
            index={index}
            isFirst={index === 0}
            isLast={index === photos.length - 1}
            key={photo.id}
            onMoveDown={() => fieldArray.move(index, index + 1)}
            onMoveUp={() => fieldArray.move(index, index - 1)}
            onRemove={() => {
              fieldArray.remove(index);
              setSelectedIds((current) => {
                const next = new Set(current);
                next.delete(photo.id);
                return next;
              });
            }}
            onToggleSelected={() =>
              setSelectedIds((current) => {
                const next = new Set(current);
                if (next.has(photo.id)) {
                  next.delete(photo.id);
                } else {
                  next.add(photo.id);
                }
                return next;
              })
            }
            photo={photo}
            selected={selectedIds.has(photo.id)}
            stage={stages[photo.id]}
          />
        ))}

        {form.formState.errors.photos?.root?.message ? (
          <AppText selectable tone="danger">
            {form.formState.errors.photos.root.message}
          </AppText>
        ) : null}
        {uploadMutation.isError ? (
          <AppText selectable tone="danger">
            {getUserFacingErrorMessage(
              uploadMutation.error,
              "We couldn't start this upload. Check the project and try again."
            )}
          </AppText>
        ) : null}

        <AppButton
          icon={uploadMutation.isError ? RefreshIcon : undefined}
          isDisabled={photos.length === 0 || isBusy}
          loading={isBusy}
          onPress={() => void submit()}
          size="lg"
        >
          {uploadMutation.isError ? "Retry upload" : "Upload photos"}
        </AppButton>
      </View>
    </Screen>
  );
}

function createPhotoId() {
  return Crypto.randomUUID();
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
