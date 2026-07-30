import { ProjectPhotoDraftCard } from "@/features/photos/components/project-photo-draft-card";
import {
  PROJECT_PHOTO_BATCH_LIMIT,
  PROJECT_PHOTO_KIND_LABELS_BY_LANGUAGE,
  PROJECT_PHOTO_KINDS
} from "@/features/photos/constants/photo.constants";
import { useUploadProjectPhotos } from "@/features/photos/hooks/use-project-photos";
import { projectPhotoBatchFormSchema } from "@/features/photos/schemas/photo.schema";
import type { ProjectPhotoDraft } from "@/features/photos/types/photo";
import { createPhotoId } from "@/features/photos/utils/photo-id";
import type { ProjectPhotoUploadStage } from "@/features/photos/services/photos.service";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useProjectPermission } from "@/features/projects/hooks/use-project-collaboration";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { SelectField } from "@/shared/ui/components/select-field";
import { AppText } from "@/shared/ui/components/text";
import { useAppToast } from "@/shared/ui/components/toast";
import { atomSpacing } from "@/shared/ui/components/theme";
import { CameraIcon, ImagePlusIcon, RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver
} from "react-hook-form";

type FormValues = { photos: ProjectPhotoDraft[] };

export default function ProjectPhotoUploadScreen({
  projectId
}: {
  projectId?: string;
}) {
  const router = useRouter();
  const { language } = useLocalization();
  const { t } = useTranslation("features/photos");
  const { t: tShared } = useTranslation("shared");
  const kindOptions = PROJECT_PHOTO_KINDS.map((kind) => ({
    label: PROJECT_PHOTO_KIND_LABELS_BY_LANGUAGE[language][kind],
    value: kind
  }));
  const toast = useAppToast();
  const routeProjectId = projectId ?? "";
  const projectQuery = useProject(projectId);
  const writePermission = useProjectPermission(
    projectId,
    "project.photos.write"
  );
  const uploadMutation = useUploadProjectPhotos(routeProjectId);
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
    resolver: zodResolver(projectPhotoBatchFormSchema) as Resolver<FormValues>
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
        description: t(
          ($) => $["features/photos"].upload.limitDescription,
          { count: remaining }
        ),
        title: t(($) => $["features/photos"].upload.limitTitle),
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
              ? t(($) => $["features/photos"].upload.libraryRequired)
              : t(($) => $["features/photos"].upload.libraryDenied)
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
          t(($) => $["features/photos"].upload.openLibrary)
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
            ? t(($) => $["features/photos"].upload.cameraRequired)
            : t(($) => $["features/photos"].upload.cameraDenied)
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
          t(($) => $["features/photos"].upload.openCamera)
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
              t(($) => $["features/photos"].upload.uploadError)
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
        description: t(
          ($) => $["features/photos"].upload.partialDescription,
          { failed: failures.length, saved: savedIds.size }
        ),
        title: t(($) => $["features/photos"].upload.partialTitle),
        tone: "warning"
      });
      return;
    }

    toast.show({
      description: t(
        ($) => $["features/photos"].upload.savedDescription,
        { count: savedIds.size }
      ),
      title: t(($) => $["features/photos"].upload.savedTitle),
      tone: "success"
    });
    router.replace(`/projects/${routeProjectId}/photos` as never);
  });

  return (
    <RouteStateBoundary
      feedback={{
        forbidden: {
          action: {
            label: t(($) => $["features/photos"].actions.backPhotos),
            onPress: () =>
              router.replace(`/projects/${routeProjectId}/photos` as never)
          },
          description: t(
            ($) => $["features/photos"].upload.uploadForbidden
          ),
          title: t(($) => $["features/photos"].upload.uploadUnavailable)
        },
        invalidParams: {
          action: {
            label: t(($) => $["features/photos"].actions.backProjects),
            onPress: () => router.replace("/projects" as never)
          }
        },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: tShared(($) => $.shared.actions.retry),
            onPress: () => {
              void Promise.all([
                projectQuery.refetch(),
                writePermission.refetch()
              ]);
            }
          },
          description: projectQuery.isError
            ? getUserFacingErrorMessage(
                projectQuery.error,
                "We couldn't load this project. Check your connection and try again."
              )
            : t(($) => $["features/photos"].upload.uploadAccess)
        },
        notFound: {
          action: {
            label: t(($) => $["features/photos"].actions.backProjects),
            onPress: () => router.replace("/projects" as never)
          }
        }
      }}
      isError={
        projectQuery.isError ||
        (Boolean(projectQuery.data) && writePermission.isError)
      }
      isForbidden={Boolean(projectQuery.data) && !writePermission.allowed}
      isInvalid={!projectId}
      isLoading={projectQuery.isLoading || writePermission.isLoading}
      isNotFound={!projectQuery.data}
      loadingFallback={
        <Screen>
          <SkeletonBlock height={420} />
        </Screen>
      }
      resourceName="project"
    >
      <Screen keyboardSafe>
        <View style={{ gap: atomSpacing[6] }}>
          <Breadcrumb
            items={[
              {
                label: t(($) => $["features/photos"].gallery.title),
                onPress: () =>
                  router.replace(`/projects/${routeProjectId}/photos` as never)
              },
              { label: t(($) => $["features/photos"].actions.add) }
            ]}
          />
          <View style={{ gap: atomSpacing[2] }}>
            <AppText tone="accent" variant="eyebrow">
              {t(($) => $["features/photos"].upload.fixedProject)}
            </AppText>
            <AppHeading selectable variant="hero">
              {projectQuery.data?.name ??
                t(($) => $["features/photos"].upload.projectPhotos)}
            </AppHeading>
            <AppText tone="muted">
              {t(($) => $["features/photos"].upload.description)}
            </AppText>
          </View>

          <AppCard padding="md" tone="muted">
            <View style={{ gap: atomSpacing[4] }}>
              <AppHeading variant="section">
                {t(($) => $["features/photos"].upload.addCount, {
                  current: photos.length,
                  limit: PROJECT_PHOTO_BATCH_LIMIT
                })}
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
                  {t(($) => $["features/photos"].upload.chooseLibrary)}
                </AppButton>
                <AppButton
                  fullWidth={false}
                  icon={CameraIcon}
                  isDisabled={isBusy || remaining <= 0}
                  onPress={() => void takePhoto()}
                  variant="bordered"
                >
                  {t(($) => $["features/photos"].upload.camera)}
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
                  <AppHeading variant="section">
                    {t(($) => $["features/photos"].upload.batchChanges)}
                  </AppHeading>
                  <AppText tone="muted" variant="bodySm">
                    {selectedIds.size > 0
                      ? t(
                          ($) =>
                            $["features/photos"].upload.selectedCount,
                          { count: selectedIds.size }
                        )
                      : t(
                          ($) => $["features/photos"].upload.noSelection
                        )}
                  </AppText>
                </View>
                <SelectField
                  disabled={isBusy}
                  label={t(
                    ($) => $["features/photos"].upload.batchCategory
                  )}
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
                    {t(($) => $["features/photos"].upload.applyCategory)}
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
                    {t(($) => $["features/photos"].upload.markMarketing)}
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
                    {t(($) => $["features/photos"].upload.clearMarketing)}
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
                t(($) => $["features/photos"].upload.startError)
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
            {t(($) =>
              uploadMutation.isError
                ? $["features/photos"].upload.retry
                : $["features/photos"].upload.upload
            )}
          </AppButton>
        </View>
      </Screen>
    </RouteStateBoundary>
  );
}
