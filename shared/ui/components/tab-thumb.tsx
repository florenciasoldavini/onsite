import { atomMotion } from "@/shared/ui/components/motion";
import { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

export function TabThumb({
  style,
  translateX
}: {
  style: StyleProp<ViewStyle>;
  translateX: number;
}) {
  const thumbX = useSharedValue(0);
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }]
  }));

  useEffect(() => {
    thumbX.value = withTiming(translateX, {
      duration: atomMotion.duration.thumb,
      easing: atomMotion.easing.measured
    });
  }, [thumbX, translateX]);

  return <Animated.View pointerEvents="none" style={[style, thumbStyle]} />;
}
