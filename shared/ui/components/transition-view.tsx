import { atomMotion } from "@/shared/ui/components/motion";
import type { ComponentProps } from "react";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition
} from "react-native-reanimated";

type TransitionViewProps = ComponentProps<typeof Animated.View> & {
  animationDelay?: number;
  animateEnter?: boolean;
  animateExit?: boolean;
  animateLayout?: boolean;
};

export function TransitionView({
  animationDelay = 0,
  animateEnter = false,
  animateExit = false,
  animateLayout = false,
  ...props
}: TransitionViewProps) {
  return (
    <Animated.View
      entering={
        animateEnter
          ? FadeIn.duration(atomMotion.duration.enter).delay(animationDelay)
          : undefined
      }
      exiting={
        animateExit ? FadeOut.duration(atomMotion.duration.exit) : undefined
      }
      layout={
        animateLayout
          ? LinearTransition.duration(atomMotion.duration.layout)
          : undefined
      }
      {...props}
    />
  );
}
