import { AppCard } from "@/shared/ui/components/card";
import { FieldMessage } from "@/shared/ui/components/field-message";
import { SearchField } from "@/shared/ui/components/input";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { MapPinIcon } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/primitives/spinner";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

const mapMarkerImage = require("@/assets/images/map-marker.png");

interface AddressFieldController {
  autocompleteError: string | null;
  isBusy: boolean;
  onBlur: () => void;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onFocus: () => void;
  onSuggestionPress: (placeId: string) => Promise<void>;
  preview: { imageDataUrl: string } | null;
  previewError: string | null;
  previewLoading: boolean;
  query: string;
  showNoResults: boolean;
  suggestions: { placeId: string; text: string }[];
  value: { address: string } | null;
}

export function AddressAutocompleteField({
  controller,
  errorText,
  label,
  required = false
}: {
  controller: AddressFieldController;
  errorText?: string | null;
  label: string;
  required?: boolean;
}) {
  const { t } = useTranslation("shared");

  return (
    <View style={{ gap: atomSpacing[3] }}>
      <SearchField
        clearAccessibilityLabel={t(($) => $.shared.address.clear, { label })}
        errorText={errorText}
        label={label}
        leftIcon={MapPinIcon}
        onBlur={controller.onBlur}
        onChangeText={controller.onChangeText}
        onClear={controller.onClear}
        onFocus={controller.onFocus}
        onPressIn={controller.onFocus}
        placeholder={t(($) => $.shared.address.searchPlaceholder)}
        required={required}
        rightSlot={
          controller.isBusy ? (
            <Spinner color={atomPalette.accent} size="small" />
          ) : null
        }
        truncate
        value={controller.query}
      />

      {controller.suggestions.length > 0 ? (
        <AppCard padding="sm" style={styles.suggestionsCard} tone="muted">
          <View style={{ gap: atomSpacing[2] }}>
            {controller.suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.placeId}
                onPress={() => {
                  void controller.onSuggestionPress(suggestion.placeId);
                }}
                style={({ pressed }) =>
                  [
                    styles.suggestion,
                    pressed ? styles.suggestionPressed : null,
                    process.env.EXPO_OS === "web" ? styles.webCursor : null
                  ] as ViewStyle[]
                }
              >
                <AppText>{suggestion.text}</AppText>
              </Pressable>
            ))}
            <AppText tone="subtle" variant="caption">
              {t(($) => $.shared.address.attribution)}
            </AppText>
          </View>
        </AppCard>
      ) : null}

      {controller.autocompleteError ? (
        <FieldMessage tone="error">
          {controller.autocompleteError}
        </FieldMessage>
      ) : null}

      {controller.showNoResults ? (
        <AppCard padding="sm" tone="muted">
          <AppText tone="subtle" variant="bodySm">
            {t(($) => $.shared.address.noResults)}
          </AppText>
        </AppCard>
      ) : null}

      {controller.previewLoading ? <SkeletonBlock height={260} /> : null}
      {controller.previewError ? (
        <FieldMessage tone="error">{controller.previewError}</FieldMessage>
      ) : null}
      {controller.value && controller.preview ? (
        <View
          accessibilityLabel={t(($) => $.shared.address.selected, {
            address: controller.value.address
          })}
          style={styles.mapPreview}
        >
          <Image
            alt={t(($) => $.shared.address.mapAlt)}
            contentFit="cover"
            source={{ uri: controller.preview.imageDataUrl }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.mapMarker}>
            <Image
              alt=""
              contentFit="contain"
              source={mapMarkerImage}
              style={styles.mapMarkerImage}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapMarker: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    left: "50%",
    position: "absolute",
    top: "50%",
    transform: [{ translateX: -15 }, { translateY: -27 }],
    width: 30
  },
  mapMarkerImage: {
    height: 30,
    width: 30
  },
  mapPreview: {
    backgroundColor: atomPalette.surfaceLow,
    borderRadius: atomRadii.lg,
    height: 260,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  suggestion: {
    borderRadius: atomRadii.md,
    padding: atomSpacing[3]
  },
  suggestionPressed: {
    opacity: 0.72
  },
  suggestionsCard: {
    overflow: "visible",
    zIndex: 20
  },
  webCursor: {
    cursor: "pointer"
  } as ViewStyle
});
