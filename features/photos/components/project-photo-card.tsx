import { PROJECT_PHOTO_KIND_LABELS_BY_LANGUAGE } from "@/features/photos/constants/photo.constants";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import type { ProjectPhoto } from "@/features/photos/types/photo";
import { AppBadge } from "@/shared/ui/components/badge";
import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { Image } from "expo-image";
import { Pressable, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

export function ProjectPhotoCard({
  onPress,
  photo,
  width
}: {
  onPress: () => void;
  photo: ProjectPhoto;
  width: number;
}) {
  const { formattingLocale, language } = useLocalization();
  const { t } = useTranslation("features/photos");
  const kindLabel = PROJECT_PHOTO_KIND_LABELS_BY_LANGUAGE[language][photo.kind];
  return (
    <Pressable
      accessibilityHint={t(
        ($) => $["features/photos"].accessibility.openHint
      )}
      accessibilityLabel={`${kindLabel} ${t(
        ($) => $["features/photos"].accessibility.photo
      )}${
        photo.is_marketing
          ? t(($) => $["features/photos"].marketing.markedSuffix)
          : ""
      }`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: atomPalette.surface,
          borderColor: atomPalette.border,
          borderRadius: atomRadii.lg,
          borderWidth: 1,
          opacity: pressed ? 0.82 : 1,
          overflow: "hidden",
          width
        },
        process.env.EXPO_OS === "web"
          ? ({ cursor: "pointer" } as ViewStyle)
          : null
      ]}
    >
      <View style={{ aspectRatio: 1.2, position: "relative" }}>
        <Image
          accessibilityLabel={
            photo.caption ??
            t(($) => $["features/photos"].accessibility.photo)
          }
          alt={
            photo.caption ??
            t(($) => $["features/photos"].accessibility.photo)
          }
          contentFit="cover"
          source={
            photo.thumbnail_url ? { uri: photo.thumbnail_url } : undefined
          }
          style={{
            backgroundColor: atomPalette.surfaceLow,
            height: "100%",
            width: "100%"
          }}
          transition={160}
        />
        {photo.is_marketing ? (
          <View
            style={{
              left: atomSpacing[3],
              position: "absolute",
              top: atomSpacing[3]
            }}
          >
            <AppBadge tone="accent">
              {t(($) => $["features/photos"].gallery.marketing)}
            </AppBadge>
          </View>
        ) : null}
      </View>
      <View style={{ gap: atomSpacing[1], padding: atomSpacing[3] }}>
        <AppText variant="label">
          {kindLabel}
        </AppText>
        <AppText numberOfLines={2} tone="muted" variant="bodySm">
          {photo.caption ||
            formatCapturedAt(
              photo.captured_at,
              formattingLocale,
              t(($) => $["features/photos"].detail.unavailable)
            )}
        </AppText>
      </View>
    </Pressable>
  );
}

function formatCapturedAt(value: string, locale: string, fallback: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? fallback
    : new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(date);
}
