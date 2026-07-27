import {
  PROJECT_PHOTO_KIND_LABELS,
  PROJECT_PHOTO_KINDS
} from "@/features/photos/constants/photo.constants";
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

const kindOptions = PROJECT_PHOTO_KINDS.map((kind) => ({
  label: PROJECT_PHOTO_KIND_LABELS[kind],
  value: kind
}));

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
  const statusLabel = getStageLabel(stage);

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
            accessibilityLabel={`Selected photo ${index + 1}`}
            alt={`Selected photo ${index + 1}`}
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
              <AppText variant="label">{`PHOTO ${String(index + 1).padStart(2, "0")}`}</AppText>
              <View style={{ flexDirection: "row", gap: atomSpacing[1] }}>
                <AppButton
                  accessibilityLabel={
                    selected
                      ? "Remove photo from batch selection"
                      : "Select photo for batch changes"
                  }
                  color={selected ? "accent" : "neutral"}
                  fullWidth={false}
                  isDisabled={disabled}
                  onPress={onToggleSelected}
                  size="sm"
                  variant={selected ? "solid" : "bordered"}
                >
                  {selected ? "Selected" : "Select"}
                </AppButton>
                <AppButton
                  accessibilityLabel="Move photo earlier"
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
                  accessibilityLabel="Move photo later"
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
                  accessibilityLabel="Remove selected photo"
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
              helperText="Choose the primary reason this photo belongs in the project record."
              label="Category"
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
              helperText="Add context that will help the team understand the photo."
              label="Caption (optional)"
              maxLength={1000}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="What should the team know about this photo?"
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

function getStageLabel(stage?: ProjectPhotoUploadStage) {
  switch (stage) {
    case "preparing":
      return "Preparing and converting photo…";
    case "retrying":
      return "Retrying photo…";
    case "uploading":
      return "Uploading full image and thumbnail…";
    case "saved":
      return "Photo saved.";
    case "failed":
      return "Photo could not be uploaded.";
    default:
      return null;
  }
}
