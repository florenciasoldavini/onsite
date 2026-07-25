import {
  SPLASH_COMPLETION_HOLD_MS,
  SPLASH_TAGLINE_REVEAL_DELAY_MS,
  SPLASH_TAGLINE_REVEAL_DURATION_MS,
  canFinishSplash,
  getSplashFadeDuration
} from "@/shared/splash/splash-state";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const NAVY = "#000a33";
const BLUE = "#0055ff";
const BLUE_300 = "#8ba4ff";
const INK_600 = "#434656";
const WHITE = "#ffffff";

const MARK_TOP =
  "M209.76,56.91l-.89-1.5c-1.62-2.74-3.85-5.08-6.52-6.82l-2.8-1.84L120.45,3.67c-9.24-4.97-20.38-4.88-29.54.24L12.76,47.63C4.82,52.07-.07,60.48,0,69.56l.7,85.53,45.5-24.06c2.04-1.08,3.3-3.2,3.28-5.5l-.33-40.48c-.02-2.29,1.21-4.41,3.21-5.53l45.8-25.62c4.9-2.74,10.87-2.79,15.82-.13l46.23,25.54c2.42,1.33,5.34,1.38,7.79.13l41.76-22.54Z";
const MARK_BOTTOM =
  "M212.76,108.54l-.27-33.24-24.58,14.2c-3.71,2.14-8.1,2.76-12.25,1.71l-10-2.51c-2.7-.68-5.54-.34-8,.96C122.2,108.43,34.83,154.33,4.84,170.16c.27,6.7,84.84,47.88,90.56,52.12,7.54,4.06,16.64,3.98,24.11-.2l85.77-45.23c6.6-3.69,7.7-10.12,7.84-17.39h-89.39l85.81-45.54c1.99-1.06,3.23-3.13,3.21-5.38Z";
const LEN_TOP = 620;
const LEN_BOTTOM = 706;
const GRID_SIZE = 44;
const TAGLINE_REVEAL_WIDTH = 168;
const LETTERS = ["O", "N", "Z", "A", "I", "T"];

const AnimatedPath = Animated.createAnimatedComponent(Path);
const EASE_DRAW = Easing.bezier(0.4, 0, 0.2, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

type AnimatedSplashProps = {
  appReady: boolean;
  onFinish: () => void;
};

export function AnimatedSplash({ appReady, onFinish }: AnimatedSplashProps) {
  const { height, width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const nativeSplashHiddenRef = useRef(false);
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canRenderViewportGrid, setCanRenderViewportGrid] = useState(
    process.env.EXPO_OS !== "web"
  );
  const [sequenceComplete, setSequenceComplete] = useState(false);

  useEffect(() => {
    if (process.env.EXPO_OS === "web") {
      setCanRenderViewportGrid(true);
    }
  }, []);

  const handleTaglineComplete = useCallback(() => {
    sequenceTimerRef.current = setTimeout(
      () => setSequenceComplete(true),
      SPLASH_COMPLETION_HOLD_MS
    );
  }, []);

  const grid = useSharedValue(0);
  const brackets = useSharedValue(0);
  const type1 = useSharedValue(0);
  const type2 = useSharedValue(0);
  const drawTop = useSharedValue(0);
  const drawBottom = useSharedValue(0);
  const fillTop = useSharedValue(0);
  const fillBottom = useSharedValue(0);
  const strokeTop = useSharedValue(1);
  const strokeBottom = useSharedValue(1);
  const dimTickL = useSharedValue(0);
  const dimBar = useSharedValue(0);
  const dimTickR = useSharedValue(0);
  const letter1 = useSharedValue(0);
  const letter2 = useSharedValue(0);
  const letter3 = useSharedValue(0);
  const letter4 = useSharedValue(0);
  const letter5 = useSharedValue(0);
  const letter6 = useSharedValue(0);
  const tagline = useSharedValue(0);
  const cursor = useSharedValue(1);
  const overlay = useSharedValue(1);

  const handleLayout = useCallback(() => {
    if (nativeSplashHiddenRef.current || process.env.EXPO_OS === "web") {
      return;
    }

    nativeSplashHiddenRef.current = true;
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      grid.value = 0.5;
      brackets.value = 1;
      type1.value = 1;
      type2.value = 1;
      drawTop.value = 1;
      drawBottom.value = 1;
      fillTop.value = 1;
      fillBottom.value = 1;
      strokeTop.value = 0;
      strokeBottom.value = 0;
      dimTickL.value = 1;
      dimBar.value = 1;
      dimTickR.value = 1;
      letter1.value = 1;
      letter2.value = 1;
      letter3.value = 1;
      letter4.value = 1;
      letter5.value = 1;
      letter6.value = 1;
      tagline.value = 1;
      setSequenceComplete(true);
      return;
    }

    grid.value = withDelay(100, withTiming(0.5, { duration: 1200 }));
    brackets.value = withDelay(300, withTiming(1, { duration: 500 }));
    type1.value = withDelay(
      400,
      withTiming(1, { duration: 900, easing: Easing.steps(17, false) })
    );
    type2.value = withDelay(
      900,
      withTiming(1, { duration: 900, easing: Easing.steps(18, false) })
    );
    drawTop.value = withDelay(
      500,
      withTiming(1, { duration: 1300, easing: EASE_DRAW })
    );
    drawBottom.value = withDelay(
      750,
      withTiming(1, { duration: 1300, easing: EASE_DRAW })
    );
    fillTop.value = withDelay(1700, withTiming(1, { duration: 700 }));
    fillBottom.value = withDelay(1850, withTiming(1, { duration: 700 }));
    strokeTop.value = withDelay(2100, withTiming(0, { duration: 600 }));
    strokeBottom.value = withDelay(2250, withTiming(0, { duration: 600 }));
    dimTickL.value = withDelay(2300, withTiming(1, { duration: 400 }));
    dimBar.value = withDelay(2350, withTiming(1, { duration: 600 }));
    dimTickR.value = withDelay(2850, withTiming(1, { duration: 400 }));

    [letter1, letter2, letter3, letter4, letter5, letter6].forEach(
      (letter, index) => {
        letter.value = withDelay(
          2500 + index * 80,
          withTiming(1, { duration: 550, easing: EASE_OUT })
        );
      }
    );

    tagline.value = withDelay(
      SPLASH_TAGLINE_REVEAL_DELAY_MS,
      withTiming(
        1,
        {
          duration: SPLASH_TAGLINE_REVEAL_DURATION_MS,
          easing: Easing.steps(18, false)
        },
        (finished) => {
          if (finished) {
            runOnJS(handleTaglineComplete)();
          }
        }
      )
    );
    cursor.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1
    );

    return () => {
      if (sequenceTimerRef.current) {
        clearTimeout(sequenceTimerRef.current);
      }
    };
  }, [
    brackets,
    cursor,
    dimBar,
    dimTickL,
    dimTickR,
    drawBottom,
    drawTop,
    fillBottom,
    fillTop,
    grid,
    handleTaglineComplete,
    letter1,
    letter2,
    letter3,
    letter4,
    letter5,
    letter6,
    reducedMotion,
    strokeBottom,
    strokeTop,
    tagline,
    type1,
    type2
  ]);

  useEffect(() => {
    if (!canFinishSplash({ appReady, sequenceComplete })) {
      return;
    }

    overlay.value = withTiming(
      0,
      { duration: getSplashFadeDuration(reducedMotion) },
      (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      }
    );
  }, [appReady, onFinish, overlay, reducedMotion, sequenceComplete]);

  const gridStyle = useAnimatedStyle(() => ({ opacity: grid.value }));
  const bracketStyle = useAnimatedStyle(() => ({ opacity: brackets.value }));
  const type1Style = useAnimatedStyle(() => ({ width: type1.value * 122 }));
  const type2Style = useAnimatedStyle(() => ({ width: type2.value * 126 }));
  const taglineStyle = useAnimatedStyle(() => ({
    width: tagline.value * TAGLINE_REVEAL_WIDTH
  }));
  const cursorStyle = useAnimatedStyle(() => ({
    opacity: tagline.value >= 1 && !reducedMotion ? cursor.value : 0
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const dimTickLStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: dimTickL.value }]
  }));
  const dimBarStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: dimBar.value }]
  }));
  const dimTickRStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: dimTickR.value }]
  }));
  const topProps = useAnimatedProps(() => ({
    fillOpacity: fillTop.value,
    strokeDashoffset: LEN_TOP * (1 - drawTop.value),
    strokeOpacity: strokeTop.value
  }));
  const bottomProps = useAnimatedProps(() => ({
    fillOpacity: fillBottom.value,
    strokeDashoffset: LEN_BOTTOM * (1 - drawBottom.value),
    strokeOpacity: strokeBottom.value
  }));
  const letter1Style = useAnimatedStyle(() => getLetterStyle(letter1.value));
  const letter2Style = useAnimatedStyle(() => getLetterStyle(letter2.value));
  const letter3Style = useAnimatedStyle(() => getLetterStyle(letter3.value));
  const letter4Style = useAnimatedStyle(() => getLetterStyle(letter4.value));
  const letter5Style = useAnimatedStyle(() => getLetterStyle(letter5.value));
  const letter6Style = useAnimatedStyle(() => getLetterStyle(letter6.value));
  const letterStyles = [
    letter1Style,
    letter2Style,
    letter3Style,
    letter4Style,
    letter5Style,
    letter6Style
  ];

  const verticalLineCount = canRenderViewportGrid
    ? Math.ceil(width / GRID_SIZE)
    : 0;
  const horizontalLineCount = canRenderViewportGrid
    ? Math.ceil(height / GRID_SIZE)
    : 0;

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={handleLayout}
      pointerEvents="none"
      style={[styles.root, overlayStyle]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, gridStyle]}>
        {Array.from({ length: verticalLineCount }, (_, index) => (
          <View
            key={`vertical-${index}`}
            style={[styles.gridVertical, { left: index * GRID_SIZE }]}
          />
        ))}
        {Array.from({ length: horizontalLineCount }, (_, index) => (
          <View
            key={`horizontal-${index}`}
            style={[styles.gridHorizontal, { top: index * GRID_SIZE }]}
          />
        ))}
      </Animated.View>

      <View style={styles.headerLeft}>
        <Animated.View style={[styles.clip, type1Style]}>
          <Text numberOfLines={1} style={styles.monoBlue}>
            ONZAIT_SPLASH.DWG
          </Text>
        </Animated.View>
        <Animated.View
          style={[styles.clip, styles.headerSecondLine, type2Style]}
        >
          <Text numberOfLines={1} style={styles.monoDim}>
            SCALE 1:1 · REV 04
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bracketTopRight, bracketStyle]} />
      <Animated.View style={[styles.bracketBottomLeft, bracketStyle]} />

      <View style={styles.center}>
        <Svg height={116} viewBox="-6 -6 230 238" width={112}>
          <AnimatedPath
            animatedProps={topProps}
            d={MARK_TOP}
            fill={WHITE}
            stroke={BLUE_300}
            strokeDasharray={`${LEN_TOP}`}
            strokeWidth={2.5}
          />
          <AnimatedPath
            animatedProps={bottomProps}
            d={MARK_BOTTOM}
            fill={BLUE}
            stroke={BLUE_300}
            strokeDasharray={`${LEN_BOTTOM}`}
            strokeWidth={2.5}
          />
        </Svg>

        <View style={styles.dimensionRow}>
          <Animated.View style={[styles.dimensionTick, dimTickLStyle]} />
          <Animated.View style={[styles.dimensionBar, dimBarStyle]} />
          <Animated.View style={[styles.dimensionTick, dimTickRStyle]} />
        </View>

        <View style={styles.wordmarkRow}>
          {LETTERS.map((letter, index) => (
            <Animated.Text
              key={letter}
              style={[styles.wordmark, letterStyles[index]]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>
      </View>

      <View style={styles.taglineRow}>
        <Animated.View style={[styles.clip, taglineStyle]}>
          <Text numberOfLines={1} style={styles.tagline}>
            BUILT FOR THE SITE
          </Text>
        </Animated.View>
        <Animated.View style={[styles.cursor, cursorStyle]} />
      </View>
    </Animated.View>
  );
}

function getLetterStyle(progress: number) {
  "worklet";

  return {
    opacity: progress,
    transform: [{ translateY: (1 - progress) * 36 }]
  };
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: NAVY,
    justifyContent: "center",
    zIndex: 999
  },
  gridVertical: {
    backgroundColor: "rgba(139,164,255,0.24)",
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 1
  },
  gridHorizontal: {
    backgroundColor: "rgba(139,164,255,0.24)",
    height: 1,
    left: 0,
    position: "absolute",
    right: 0
  },
  headerLeft: { left: 24, position: "absolute", top: 84 },
  headerSecondLine: { marginTop: 6 },
  clip: { overflow: "hidden" },
  monoBlue: {
    color: BLUE_300,
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 11,
    letterSpacing: 0.7
  },
  monoDim: {
    color: INK_600,
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 11,
    letterSpacing: 0.7
  },
  bracketTopRight: {
    borderColor: BLUE_300,
    borderRightWidth: 2,
    borderTopWidth: 2,
    height: 22,
    position: "absolute",
    right: 24,
    top: 84,
    width: 22
  },
  bracketBottomLeft: {
    borderBottomWidth: 2,
    borderColor: BLUE_300,
    borderLeftWidth: 2,
    bottom: 120,
    height: 22,
    left: 24,
    position: "absolute",
    width: 22
  },
  center: { alignItems: "center" },
  dimensionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 26
  },
  dimensionTick: { backgroundColor: BLUE_300, height: 14, width: 1 },
  dimensionBar: { backgroundColor: BLUE_300, height: 1, width: 96 },
  wordmarkRow: { flexDirection: "row", marginTop: 14, overflow: "hidden" },
  wordmark: {
    color: WHITE,
    fontFamily: "Geist-Black",
    fontSize: 32,
    letterSpacing: 3.8
  },
  taglineRow: {
    alignItems: "center",
    bottom: 64,
    flexDirection: "row",
    gap: 2,
    position: "absolute"
  },
  tagline: {
    color: BLUE_300,
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 12,
    letterSpacing: 1.2
  },
  cursor: { backgroundColor: BLUE_300, height: 14, width: 7 }
});
