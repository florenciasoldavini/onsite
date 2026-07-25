import { atomMotion } from "@/shared/ui/components/motion.web";
import { Button } from "@/shared/ui/primitives/button";
import { useEffect, useState } from "react";
import type { ViewStyle } from "react-native";

export const MotionButton = Button;

export function useButtonPressMotion(isInteractionDisabled: boolean) {
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (isInteractionDisabled) {
      setIsPressed(false);
    }
  }, [isInteractionDisabled]);

  const animatedPressStyle = {
    transform: [{ scale: isPressed ? atomMotion.scale.buttonPressed : 1 }],
    transitionDuration: `${
      isPressed ? atomMotion.duration.pressIn : atomMotion.duration.pressOut
    }ms`,
    transitionProperty: "transform",
    transitionTimingFunction: atomMotion.easing.measured
  } as unknown as ViewStyle;

  return {
    animatedPressStyle,
    handleMotionPressIn() {
      setIsPressed(true);
    },
    handleMotionPressOut() {
      setIsPressed(false);
    }
  };
}
