import {
  PROJECT_PHOTO_KIND_LABELS_BY_LANGUAGE,
  PROJECT_PHOTO_KINDS
} from "@/features/photos/constants/photo.constants";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import { PhotoMarketingField } from "@/features/photos/components/photo-marketing-field";
import type { ProjectPhotoDraft } from "@/features/photos/types/photo";
import type { ProjectPhotoUploadStage } from "@/features/photos/services/photos.service";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { SelectField } from "@/shared/ui/components/select-field";
import { AppText } from "@/shared/ui/components/text";
import { TextAreaField } from "@/shared/ui/components/textarea";
import {
  atomPalette,
  atomSpacing
} from "@/shared/ui/components/theme";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon
} from "@/shared/ui/icons";
import { Image } from "expo-image";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

export function ProjectPhotoDraftCard({
  control,
  disabled,
  error,
  errors,
  index,
  isFirst,
  isLast,
  onMoveDown,
  onMoveUp,
  onRemove,
  onToggleSelected,
  photo,
  selected,
  stage
}: {
  control: Control<{ photos: ProjectPhotoDraft[] }>;
  disabled: boolean;
  error?: string | null;
  errors: FieldErrors<ProjectPhotoDraft>;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onToggleSelected: () => void;
  photo: ProjectPhotoDraft;
  selected: boolean;
  stage?: ProjectPhotoUploadStage;
}) {
  const { language } = useLocalization();
  const { t } = useTranslation("features/photos");
  const kindOptions = PROJECT_PHOTO_KINDS.map((kind) => ({
    label: PROJECT_PHOTO_KIND_LABELS_BY_LANGUAGE[language][kind],
    value: kind
  }));
  const statusLabel = getStageLabel(stage, t);

  return (
    <AppCard padding="md">
      <View style={{ gap: atomSpacing[5] }}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: atomSpacing[4]
          }}
        >
          <Image
            accessibilityLabel={t(
              ($) => $["features/photos"].accessibility.selectedPhoto,
              { number: index + 1 }
            )}
            alt={t(
              ($) => $["features/photos"].accessibility.selectedPhoto,
              { number: index + 1 }
            )}
            contentFit="cover"
            source={{ uri: photo.asset.uri }}
            style={{
              backgroundColor: atomPalette.surfaceLow,
              borderRadius: 12,
              height: 160,
              minWidth: 160,
              flexGrow: 1
            }}
            transition={160}
          />
          <View
            style={{
              flexBasis: 250,
              flexGrow: 2,
              gap: atomSpacing[3],
              minWidth: 220
            }}
          >
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                gap: atomSpacing[2],
                justifyContent: "space-between"
              }}
            >
              <AppText variant="label">
                {t(($) => $["features/photos"].upload.photoNumber, {
                  number: String(index + 1).padStart(2, "0")
                })}
              </AppText>
              <View style={{ flexDirection: "row", gap: atomSpacing[1] }}>
                <AppButton
                  accessibilityLabel={
                    selected
                      ? t(
                          ($) =>
                            $["features/photos"].accessibility.removeSelection
                        )
                      : t(
                          ($) =>
                            $["features/photos"].accessibility.selectBatch
                        )
                  }
                  color={selected ? "accent" : "neutral"}
                  fullWidth={false}
                  isDisabled={disabled}
                  onPress={onToggleSelected}
                  size="sm"
                  variant={selected ? "solid" : "bordered"}
                >
                  {selected
                    ? t(($) => $["features/photos"].actions.selected)
                    : t(($) => $["features/photos"].actions.select)}
                </AppButton>
                <AppButton
                  accessibilityLabel={t(
                    ($) => $["features/photos"].accessibility.moveEarlier
                  )}
                  color="neutral"
                  fullWidth={false}
                  icon={ChevronUpIcon}
                  isDisabled={disabled || isFirst}
                  layout="icon"
                  onPress={onMoveUp}
                  size="sm"
                  variant="ghost"
                />
                <AppButton
                  accessibilityLabel={t(
                    ($) => $["features/photos"].accessibility.moveLater
                  )}
                  color="neutral"
                  fullWidth={false}
                  icon={ChevronDownIcon}
                  isDisabled={disabled || isLast}
                  layout="icon"
                  onPress={onMoveDown}
                  size="sm"
                  variant="ghost"
                />
                <AppButton
                  accessibilityLabel={t(
                    ($) => $["features/photos"].accessibility.remove
                  )}
                  color="danger"
                  fullWidth={false}
                  icon={TrashIcon}
                  isDisabled={disabled}
                  layout="icon"
                  onPress={onRemove}
                  size="sm"
                  variant="ghost"
                />
              </View>
            </View>
            {statusLabel ? (
              <AppText
                selectable
                tone={stage === "failed" ? "danger" : "accent"}
                variant="bodySm"
              >
                {statusLabel}
              </AppText>
            ) : null}
            {error ? (
              <AppText selectable tone="danger" variant="bodySm">
                {error}
              </AppText>
            ) : null}
          </View>
        </View>

        <Controller
          control={control}
          name={`photos.${index}.kind`}
          render={({ field }) => (
            <SelectField
              disabled={disabled}
              errorText={errors.kind?.message}
              helperText={t(
                ($) => $["features/photos"].upload.categoryHelper
              )}
              label={t(($) => $["features/photos"].upload.category)}
              onChange={field.onChange}
              options={kindOptions}
              value={field.value}
            />
          )}
        />

        <Controller
          control={control}
          name={`photos.${index}.caption`}
          render={({ field }) => (
            <TextAreaField
              editable={!disabled}
              errorText={errors.caption?.message}
              helperText={t(
                ($) => $["features/photos"].detail.captionHelper
              )}
              label={t(($) => $["features/photos"].detail.caption)}
              maxLength={1000}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder={t(
                ($) => $["features/photos"].upload.captionPlaceholder
              )}
              value={field.value}
            />
          )}
        />

        <Controller
          control={control}
          name={`photos.${index}.is_marketing`}
          render={({ field }) => (
            <PhotoMarketingField
              disabled={disabled}
              onChange={field.onChange}
              value={field.value}
            />
          )}
        />
      </View>
    </AppCard>
  );
}

function getStageLabel(
  stage: ProjectPhotoUploadStage | undefined,
  t: ReturnType<typeof useTranslation<"features/photos">>["t"]
) {
  switch (stage) {
    case "preparing":
      return t(($) => $["features/photos"].stage.preparing);
    case "retrying":
      return t(($) => $["features/photos"].stage.retrying);
    case "uploading":
      return t(($) => $["features/photos"].stage.uploading);
    case "saved":
      return t(($) => $["features/photos"].stage.saved);
    case "failed":
      return t(($) => $["features/photos"].stage.failed);
    default:
      return null;
  }
}
