import { atomMotion } from "@/shared/ui/components/motion";
import { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

export function FocusGlow({
  active,
  style
}: {
  active: boolean;
  style: StyleProp<ViewStyle>;
}) {
  const focusGlow = useSharedValue(0);
  const focusGlowStyle = useAnimatedStyle(() => ({
    opacity: focusGlow.value,
    transform: [{ scale: 1 + focusGlow.value * atomMotion.scale.focusGlow }]
  }));

  useEffect(() => {
    focusGlow.value = withTiming(active ? 1 : 0, {
      duration: atomMotion.duration.focus,
      easing: atomMotion.easing.measured
    });
  }, [active, focusGlow]);

  return <Animated.View pointerEvents="none" style={[style, focusGlowStyle]} />;
}
