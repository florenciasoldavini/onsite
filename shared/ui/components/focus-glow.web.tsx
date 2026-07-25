import { atomMotion } from "@/shared/ui/components/motion.web";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

export function FocusGlow({
  active,
  style
}: {
  active: boolean;
  style: StyleProp<ViewStyle>;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        style,
        {
          opacity: active ? 1 : 0,
          transform: [{ scale: active ? 1 + atomMotion.scale.focusGlow : 1 }],
          transitionDuration: `${atomMotion.duration.focus}ms`,
          transitionProperty: "opacity, transform",
          transitionTimingFunction: atomMotion.easing.measured
        } as unknown as ViewStyle
      ]}
    />
  );
}
