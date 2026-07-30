import { PROJECT_LABELS_BY_LANGUAGE } from "@/features/projects/constants/project.constants";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import type {
  ProjectStatus,
  ProjectSummary
} from "@/features/projects/types/project.types";
import {
  ProjectCardMotionView,
  ProjectProgressFill,
  ProjectStatusPulse,
  useProjectCardPressMotion
} from "@/features/projects/components/project-card-motion";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import {
  atomCardRadius,
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { ImageOffIcon, MapPinIcon } from "@/shared/ui/icons";
import { formatDateOnly } from "@/shared/utils/date-only";
import { Image } from "expo-image";
import { useState } from "react";
import { Platform, Pressable, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

export function ProjectCard({
  isDeleting = false,
  onPress,
  project
}: {
  isDeleting?: boolean;
  onPress: () => void;
  project: ProjectSummary;
}) {
  const { language } = useLocalization();
  const { t } = useTranslation("features/projects");
  const labels = PROJECT_LABELS_BY_LANGUAGE[language];
  const [isHovered, setIsHovered] = useState(false);
  const { pressStyle, handleMotionPressIn, handleMotionPressOut } =
    useProjectCardPressMotion();
  const cardBorderColor =
    Platform.OS === "web" && isHovered
      ? atomPalette.border
      : atomPalette.borderSubtle;

  return (
    <ProjectCardMotionView style={pressStyle}>
      <Pressable
        accessibilityRole="button"
        disabled={isDeleting}
        onHoverIn={() => {
          if (!isDeleting && Platform.OS === "web") {
            setIsHovered(true);
          }
        }}
        onHoverOut={() => {
          if (Platform.OS === "web") {
            setIsHovered(false);
          }
        }}
        onPress={onPress}
        onPressIn={() => {
          if (!isDeleting) {
            handleMotionPressIn();
          }
        }}
        onPressOut={() => {
          handleMotionPressOut();
        }}
        style={({ pressed }) =>
          [
            {
              opacity: isDeleting ? 0.55 : pressed ? 0.9 : 1
            },
            Platform.OS === "web" && !isDeleting
              ? ({ cursor: "pointer" } as ViewStyle)
              : null
          ] as ViewStyle[]
        }
      >
        <AppCard style={{ borderColor: cardBorderColor }}>
          <View style={{ gap: atomSpacing[4], marginBottom: atomSpacing[5] }}>
            <View
              style={{
                backgroundColor: atomPalette.surfaceLow,
                height: 150,
                marginHorizontal: -atomSpacing[5],
                marginTop: -atomSpacing[5],
                overflow: "hidden",
                position: "relative"
              }}
            >
              {project.cover_image_url ? (
                <Image
                  contentFit="cover"
                  source={{ uri: project.cover_image_url }}
                  style={{ height: "100%", width: "100%" }}
                />
              ) : (
                <View
                  style={{
                    alignItems: "center",
                    flex: 1,
                    justifyContent: "center"
                  }}
                >
                  <ImageOffIcon color={atomPalette.textSubtle} size={28} />
                </View>
              )}
              <ProjectStatusCornerLabel
                borderColor={cardBorderColor}
                label={labels.statuses[project.status]}
                status={project.status}
              />
            </View>

            <View style={{ gap: atomSpacing[3] }}>
              <View
                style={{
                  alignItems: "flex-start",
                  flexDirection: "row",
                  gap: atomSpacing[3],
                  justifyContent: "space-between"
                }}
              >
                <View style={{ flex: 1, gap: atomSpacing[2] }}>
                  <AppText variant="eyebrow">
                    {labels.types[project.project_type]}
                  </AppText>
                  <AppHeading variant="card">{project.name}</AppHeading>
                </View>
              </View>

              <View style={{ gap: atomSpacing[2] }}>
                <View
                  style={{
                    alignItems: "center",
                    flexDirection: "row",
                    gap: atomSpacing[2]
                  }}
                >
                  <MapPinIcon color={atomPalette.textMuted} size={16} />
                  <AppText
                    numberOfLines={1}
                    style={{ flex: 1 }}
                    tone="muted"
                    variant="bodySm"
                  >
                    {project.address}
                  </AppText>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: atomSpacing[2]
                  }}
                >
                  <ProjectMetaLabel
                    value={`PHASE_${formatMonoLabel(
                      labels.phases[project.phase]
                    )}`}
                  />
                  <ProjectMetaLabel
                    value={`ETA · ${formatDateOnly(project.estimated_end_date, {
                      fallback: "—"
                    })}`}
                  />
                </View>
              </View>
            </View>
          </View>
          <ProjectProgressIndicator progress={project.progress_percentage} />
        </AppCard>
      </Pressable>
    </ProjectCardMotionView>
  );
}
function ProjectMetaLabel({ value }: { value: string }) {
  return (
    <View
      style={{
        borderColor: atomPalette.borderSubtle,
        borderRadius: atomRadii.full,
        borderWidth: 1,
        paddingHorizontal: atomSpacing[2],
        paddingVertical: 2
      }}
    >
      <AppText tone="subtle" variant="meta">
        {value}
      </AppText>
    </View>
  );
}

export function ProjectProgressIndicator({ progress }: { progress: number }) {
  const { t } = useTranslation("features/projects");
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={{ gap: atomSpacing[2] }}>
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between"
        }}
      >
        <AppText tone="subtle" variant="meta">
          {t(($) => $["features/projects"].list.progress).toUpperCase()}
        </AppText>
        <AppText
          tone="accent"
          variant="meta"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {clampedProgress}%
        </AppText>
      </View>
      <ProjectProgressBar progress={clampedProgress} />
    </View>
  );
}

function ProjectProgressBar({ progress }: { progress: number }) {
  const { t } = useTranslation("features/projects");
  const [trackWidth, setTrackWidth] = useState(0);
  return (
    <View
      accessibilityLabel={t(
        ($) => $["features/projects"].accessibility.progress,
        { progress }
      )}
      onLayout={(event) => {
        setTrackWidth(event.nativeEvent.layout.width);
      }}
      style={{
        backgroundColor: `${atomPalette.accent}1A`,
        borderRadius: atomRadii.full,
        height: 8,
        overflow: "hidden",
        position: "relative"
      }}
    >
      <ProjectProgressFill
        progress={progress}
        trackWidth={trackWidth}
        style={{
          backgroundColor: atomPalette.accent,
          borderRadius: atomRadii.full,
          height: "100%"
        }}
      />
    </View>
  );
}

function formatMonoLabel(value: string) {
  return value.trim().toUpperCase().replaceAll(" ", "_");
}

function ProjectStatusCornerLabel({
  borderColor,
  label,
  status
}: {
  borderColor: string;
  label: string;
  status: ProjectStatus;
}) {
  const shouldPulse = status === "in_progress";

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: `${atomPalette.surface}E6`,
        borderBottomColor: borderColor,
        borderBottomLeftRadius: atomCardRadius,
        borderBottomWidth: 1,
        borderLeftColor: borderColor,
        borderLeftWidth: 1,
        borderTopRightRadius: atomCardRadius,
        flexDirection: "row",
        gap: atomSpacing[2],
        height: 36,
        justifyContent: "center",
        minWidth: 128,
        paddingHorizontal: atomSpacing[4],
        position: "absolute",
        right: 0,
        top: 0,
        zIndex: 2
      }}
    >
      <View
        style={{
          alignItems: "center",
          height: 16,
          justifyContent: "center",
          width: 16
        }}
      >
        <ProjectStatusPulse
          shouldPulse={shouldPulse}
          haloStyle={{
            backgroundColor: atomPalette.accent,
            borderRadius: atomRadii.full,
            height: 12,
            position: "absolute",
            width: 12
          }}
          dotStyle={{
            backgroundColor: atomPalette.accent,
            borderRadius: atomRadii.full,
            height: 8,
            width: 8
          }}
        />
      </View>
      <AppText tone="accent" variant="meta">
        {label.toUpperCase().replaceAll(" ", "_")}
      </AppText>
    </View>
  );
}
