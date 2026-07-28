import { PROJECT_PHOTO_KIND_LABELS } from "@/features/photos/constants/photo.constants";
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

export function ProjectPhotoCard({
  onPress,
  photo,
  width
}: {
  onPress: () => void;
  photo: ProjectPhoto;
  width: number;
}) {
  return (
    <Pressable
      accessibilityHint="Opens photo details"
      accessibilityLabel={`${PROJECT_PHOTO_KIND_LABELS[photo.kind]} project photo${photo.is_marketing ? ", marked for marketing" : ""}`}
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
          accessibilityLabel={photo.caption ?? "Project photo"}
          alt={photo.caption ?? "Project photo"}
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
            <AppBadge tone="accent">Marketing</AppBadge>
          </View>
        ) : null}
      </View>
      <View style={{ gap: atomSpacing[1], padding: atomSpacing[3] }}>
        <AppText variant="label">
          {PROJECT_PHOTO_KIND_LABELS[photo.kind]}
        </AppText>
        <AppText numberOfLines={2} tone="muted" variant="bodySm">
          {photo.caption || formatCapturedAt(photo.captured_at)}
        </AppText>
      </View>
    </Pressable>
  );
}

function formatCapturedAt(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Capture date unavailable"
    : date.toLocaleString();
}
