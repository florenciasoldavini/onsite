import {
  PROJECT_PHASE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS
} from "@/features/projects/constants/project.constants";
import type {
  ProjectStatus,
  ProjectSummary
} from "@/features/projects/types/project.types";
import { AppCard, AppHeading, AppText } from "@/shared/ui/components";
import { atomMotion } from "@/shared/ui/components/motion";
import {
  atomCardRadius,
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { ImageOffIcon, MapPinIcon } from "@/shared/ui/icons";
import { formatDateOnly } from "@/shared/utils/date-only";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Platform, Pressable, View, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";

export function ProjectCard({
  isDeleting = false,
  onPress,
  project
}: {
  isDeleting?: boolean;
  onPress: () => void;
  project: ProjectSummary;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }]
  }));
  const cardBorderColor =
    Platform.OS === "web" && isHovered
      ? atomPalette.border
      : atomPalette.borderSubtle;

  return (
    <Animated.View style={pressStyle}>
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
            pressScale.value = withTiming(atomMotion.scale.cardPressed, {
              duration: atomMotion.duration.pressIn,
              easing: atomMotion.easing.measured
            });
          }
        }}
        onPressOut={() => {
          pressScale.value = withTiming(1, {
            duration: atomMotion.duration.pressOut,
            easing: atomMotion.easing.measured
          });
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
                label={PROJECT_STATUS_LABELS[project.status]}
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
                    {PROJECT_TYPE_LABELS[project.project_type]}
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
                      PROJECT_PHASE_LABELS[project.phase]
                    )}`}
                  />
                  <ProjectMetaLabel
                    value={`ETA · ${formatDateOnly(project.estimated_end_date, {
                      fallback: "TBD"
                    })}`}
                  />
                </View>
              </View>
            </View>
          </View>
          <ProjectProgressIndicator progress={project.progress_percentage} />
        </AppCard>
      </Pressable>
    </Animated.View>
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
          PROGRESS
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
  const [trackWidth, setTrackWidth] = useState(0);
  const animatedProgress = useSharedValue(0);
  const fillStyle = useAnimatedStyle(() => ({
    width:
      animatedProgress.value > 0 && trackWidth > 0
        ? Math.max(4, trackWidth * (animatedProgress.value / 100))
        : 0
  }));

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: atomMotion.duration.progress,
      easing: atomMotion.easing.measured
    });
  }, [animatedProgress, progress]);

  return (
    <View
      accessibilityLabel={`Project progress ${progress}%`}
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
      <Animated.View
        style={[
          {
            backgroundColor: atomPalette.accent,
            borderRadius: atomRadii.full,
            height: "100%"
          },
          fillStyle
        ]}
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
  const pulse = useSharedValue(0);
  const shouldPulse = status === "in_progress";

  useEffect(() => {
    if (!shouldPulse) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: atomMotion.duration.scan,
          easing: atomMotion.easing.status
        }),
        withTiming(0, {
          duration: atomMotion.duration.scan,
          easing: atomMotion.easing.status
        })
      ),
      -1
    );

    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse, shouldPulse]);

  const pulseHaloStyle = useAnimatedStyle(() => ({
    opacity: shouldPulse ? 0.1 + pulse.value * 0.16 : 0
  }));
  const pulseDotStyle = useAnimatedStyle(() => ({
    opacity: shouldPulse ? 0.72 + pulse.value * 0.28 : 1
  }));

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
        <Animated.View
          style={[
            {
              backgroundColor: atomPalette.accent,
              borderRadius: atomRadii.full,
              height: 12,
              position: "absolute",
              width: 12
            },
            pulseHaloStyle
          ]}
        />
        <Animated.View
          style={[
            {
              backgroundColor: atomPalette.accent,
              borderRadius: atomRadii.full,
              height: 8,
              width: 8
            },
            pulseDotStyle
          ]}
        />
      </View>
      <AppText tone="accent" variant="meta">
        {label.toUpperCase().replaceAll(" ", "_")}
      </AppText>
    </View>
  );
}
