import type { ProjectFormValues } from "@/features/projects/types/project.types";
import { FieldMessage } from "@/shared/ui/components/field-message";
import { FieldLabel } from "@/shared/ui/components/label";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import { AppText } from "@/shared/ui/components/text";
import { ImagePlusIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle
} from "react-native";

export function ProjectCoverPicker({
  currentUrl,
  disabled = false,
  onChange,
  value
}: {
  currentUrl: string | null;
  disabled?: boolean;
  onChange: (asset: ProjectFormValues["coverAsset"]) => void;
  value: ProjectFormValues["coverAsset"];
}) {
  const { t } = useTranslation("features/projects");
  const previewUri = value?.uri ?? currentUrl;
  const [pickerError, setPickerError] = useState<string | null>(null);

  const pickImage = async () => {
    setPickerError(null);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPickerError(
          permission.canAskAgain
            ? t(($) => $["features/projects"].form.coverAccessRequired)
            : t(($) => $["features/projects"].form.coverAccessDenied)
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      onChange({
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        uri: asset.uri
      });
    } catch (error) {
      setPickerError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/projects"].form.coverLibraryError)
        )
      );
    }
  };

  return (
    <View style={styles.root}>
      <FieldLabel>{t(($) => $["features/projects"].form.cover)}</FieldLabel>
      <Pressable
        accessibilityLabel={t(
          ($) => $["features/projects"].form.chooseCoverAccessibility
        )}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => void pickImage()}
        style={StyleSheet.flatten([
          styles.picker,
          disabled ? styles.disabled : null,
          Platform.OS === "web" ? styles.webCursor : null
        ])}
      >
        {previewUri ? (
          <Image
            contentFit="cover"
            source={{ uri: previewUri }}
            style={styles.image}
          />
        ) : (
          <View style={styles.placeholder}>
            <ImagePlusIcon color={atomPalette.textMuted} size={24} />
            <AppText tone="muted">
              {t(($) => $["features/projects"].form.chooseCover)}
            </AppText>
          </View>
        )}
      </Pressable>
      {pickerError ? (
        <FieldMessage tone="error">{pickerError}</FieldMessage>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.7
  },
  image: {
    height: "100%",
    width: "100%"
  },
  picker: {
    alignItems: "center",
    backgroundColor: atomPalette.surfaceLow,
    borderColor: atomPalette.borderSubtle,
    borderRadius: 14,
    borderWidth: 1,
    height: 132,
    justifyContent: "center",
    overflow: "hidden"
  },
  placeholder: {
    alignItems: "center",
    gap: atomSpacing[2]
  },
  root: {
    gap: atomSpacing[3]
  },
  webCursor: {
    cursor: "pointer"
  } as ViewStyle
});
