import { useEffect, useRef, type ComponentProps } from "react";
import { Animated, Easing } from "react-native";

type TransitionViewProps = ComponentProps<typeof Animated.View> & {
  animationDelay?: number;
  animateEnter?: boolean;
  animateExit?: boolean;
  animateLayout?: boolean;
};

export function TransitionView({
  animationDelay = 0,
  animateEnter = false,
  animateExit: _animateExit,
  animateLayout: _animateLayout,
  ...props
}: TransitionViewProps) {
  const opacity = useRef(new Animated.Value(animateEnter ? 0 : 1)).current;

  useEffect(() => {
    if (!animateEnter) {
      opacity.setValue(1);
      return;
    }

    const animation = Animated.sequence([
      Animated.delay(animationDelay),
      Animated.timing(opacity, {
        duration: 160,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: false
      })
    ]);

    animation.start();
    return () => animation.stop();
  }, [animateEnter, animationDelay, opacity]);

  return <Animated.View {...props} style={[props.style, { opacity }]} />;
}
