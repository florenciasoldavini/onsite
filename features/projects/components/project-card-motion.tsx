import { atomMotion } from "@/shared/ui/components/motion";
import { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";

export const ProjectCardMotionView = Animated.View;

export function useProjectCardPressMotion() {
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }]
  }));

  return {
    pressStyle,
    handleMotionPressIn() {
      pressScale.value = withTiming(atomMotion.scale.cardPressed, {
        duration: atomMotion.duration.pressIn,
        easing: atomMotion.easing.measured
      });
    },
    handleMotionPressOut() {
      pressScale.value = withTiming(1, {
        duration: atomMotion.duration.pressOut,
        easing: atomMotion.easing.measured
      });
    }
  };
}

export function ProjectProgressFill({
  progress,
  style,
  trackWidth
}: {
  progress: number;
  style: StyleProp<ViewStyle>;
  trackWidth: number;
}) {
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

  return <Animated.View style={[style, fillStyle]} />;
}

export function ProjectStatusPulse({
  dotStyle,
  haloStyle,
  shouldPulse
}: {
  dotStyle: StyleProp<ViewStyle>;
  haloStyle: StyleProp<ViewStyle>;
  shouldPulse: boolean;
}) {
  const pulse = useSharedValue(0);
  const pulseHaloStyle = useAnimatedStyle(() => ({
    opacity: shouldPulse ? 0.1 + pulse.value * 0.16 : 0
  }));
  const pulseDotStyle = useAnimatedStyle(() => ({
    opacity: shouldPulse ? 0.72 + pulse.value * 0.28 : 1
  }));

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

    return () => cancelAnimation(pulse);
  }, [pulse, shouldPulse]);

  return (
    <>
      <Animated.View style={[haloStyle, pulseHaloStyle]} />
      <Animated.View style={[dotStyle, pulseDotStyle]} />
    </>
  );
}
