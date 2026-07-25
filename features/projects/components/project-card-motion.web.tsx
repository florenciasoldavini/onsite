import { atomMotion } from "@/shared/ui/components/motion.web";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native";

export const ProjectCardMotionView = View;

export function useProjectCardPressMotion() {
  const [isPressed, setIsPressed] = useState(false);
  const pressStyle = {
    transform: [{ scale: isPressed ? atomMotion.scale.cardPressed : 1 }],
    transitionDuration: `${
      isPressed ? atomMotion.duration.pressIn : atomMotion.duration.pressOut
    }ms`,
    transitionProperty: "transform",
    transitionTimingFunction: atomMotion.easing.measured
  } as unknown as ViewStyle;

  return {
    pressStyle,
    handleMotionPressIn() {
      setIsPressed(true);
    },
    handleMotionPressOut() {
      setIsPressed(false);
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
  const width =
    progress > 0 && trackWidth > 0
      ? Math.max(4, trackWidth * (progress / 100))
      : 0;

  return (
    <View
      style={[
        style,
        {
          transitionDuration: `${atomMotion.duration.progress}ms`,
          transitionProperty: "width",
          transitionTimingFunction: atomMotion.easing.measured,
          width
        } as unknown as ViewStyle
      ]}
    />
  );
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
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shouldPulse) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: atomMotion.duration.scan,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: false
        }),
        Animated.timing(pulse, {
          duration: atomMotion.duration.scan,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: false
        })
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse, shouldPulse]);

  return (
    <>
      <Animated.View
        style={[
          haloStyle,
          {
            opacity: shouldPulse
              ? pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.26]
                })
              : 0
          }
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: shouldPulse
              ? pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.72, 1]
                })
              : 1
          }
        ]}
      />
    </>
  );
}
