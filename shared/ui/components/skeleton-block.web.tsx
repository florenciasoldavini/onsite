import { atomPalette, atomRadii } from "@/shared/ui/components/theme";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  useWindowDimensions,
  type ViewStyle
} from "react-native";

export function SkeletonBlock({
  height,
  radius = atomRadii.md,
  style,
  width = "100%"
}: {
  height: number;
  radius?: number;
  style?: ViewStyle;
  width?: ViewStyle["width"];
}) {
  const { t } = useTranslation("shared");
  const progress = useRef(new Animated.Value(0)).current;
  const { width: viewportWidth } = useWindowDimensions();
  const numericWidth = typeof width === "number" ? width : viewportWidth;
  const shimmerTravel = Math.max(numericWidth, viewportWidth) + 180;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        duration: 1800,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: false
      })
    );

    animation.start();
    return () => animation.stop();
  }, [progress]);

  return (
    <Animated.View
      accessibilityLabel={t(($) => $.shared.accessibility.loading)}
      style={[
        {
          backgroundColor: atomPalette.surfaceStrong,
          borderRadius: radius,
          height,
          opacity: progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.86, 0.92, 0.86]
          }),
          overflow: "hidden",
          width
        },
        style
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          backgroundColor: atomPalette.surface,
          borderRadius: radius,
          height: height * 1.5,
          left: 0,
          opacity: 0.1,
          position: "absolute",
          top: -height * 0.25,
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-120, -120 + shimmerTravel]
              })
            }
          ],
          width: Math.min(120, Math.max(56, numericWidth * 0.28))
        }}
      />
    </Animated.View>
  );
}
