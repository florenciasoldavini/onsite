import { atomMotion } from "@/shared/ui/components/motion.web";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

export function TabThumb({
  style,
  translateX
}: {
  style: StyleProp<ViewStyle>;
  translateX: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        style,
        {
          transform: [{ translateX }],
          transitionDuration: `${atomMotion.duration.thumb}ms`,
          transitionProperty: "transform",
          transitionTimingFunction: atomMotion.easing.measured
        } as unknown as ViewStyle
      ]}
    />
  );
}
