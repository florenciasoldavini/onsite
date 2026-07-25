import { atomMotion } from "@/shared/ui/components/motion";
import { Button } from "@/shared/ui/primitives/button";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

export const MotionButton = Animated.createAnimatedComponent(Button);

export function useButtonPressMotion(isInteractionDisabled: boolean) {
  const pressScale = useSharedValue(1);
  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }]
  }));

  useEffect(() => {
    if (isInteractionDisabled) {
      pressScale.value = withTiming(1, {
        duration: atomMotion.duration.pressOut,
        easing: atomMotion.easing.measured
      });
    }
  }, [isInteractionDisabled, pressScale]);

  return {
    animatedPressStyle,
    handleMotionPressIn() {
      pressScale.value = withTiming(atomMotion.scale.buttonPressed, {
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
