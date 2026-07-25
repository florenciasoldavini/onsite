import {
  SPLASH_SEQUENCE_DURATION_MS,
  canFinishSplash,
  getSplashFadeDuration
} from "@/shared/splash/splash-state";
import { getMonoFontStyle, getSansFontStyle } from "@/shared/theme/fonts";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import Svg, { Path } from "react-native-svg";

const NAVY = "#000a33";
const BLUE = "#0055ff";
const BLUE_300 = "#8ba4ff";
const INK_600 = "#434656";
const WHITE = "#ffffff";
const GRID_SIZE = 44;
const LETTERS = ["O", "N", "Z", "A", "I", "T"];
const MARK_TOP =
  "M209.76,56.91l-.89-1.5c-1.62-2.74-3.85-5.08-6.52-6.82l-2.8-1.84L120.45,3.67c-9.24-4.97-20.38-4.88-29.54.24L12.76,47.63C4.82,52.07-.07,60.48,0,69.56l.7,85.53,45.5-24.06c2.04-1.08,3.3-3.2,3.28-5.5l-.33-40.48c-.02-2.29,1.21-4.41,3.21-5.53l45.8-25.62c4.9-2.74,10.87-2.79,15.82-.13l46.23,25.54c2.42,1.33,5.34,1.38,7.79.13l41.76-22.54Z";
const MARK_BOTTOM =
  "M212.76,108.54l-.27-33.24-24.58,14.2c-3.71,2.14-8.1,2.76-12.25,1.71l-10-2.51c-2.7-.68-5.54-.34-8,.96C122.2,108.43,34.83,154.33,4.84,170.16c.27,6.7,84.84,47.88,90.56,52.12,7.54,4.06,16.64,3.98,24.11-.2l85.77-45.23c6.6-3.69,7.7-10.12,7.84-17.39h-89.39l85.81-45.54c1.99-1.06,3.23-3.13,3.21-5.38Z";

type AnimatedSplashProps = {
  appReady: boolean;
  onFinish: () => void;
};

export function AnimatedSplash({ appReady, onFinish }: AnimatedSplashProps) {
  const { height, width } = useWindowDimensions();
  const [canRenderViewportGrid, setCanRenderViewportGrid] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  const gridOpacity = useRef(new Animated.Value(0)).current;
  const blueprintOpacity = useRef(new Animated.Value(0)).current;
  const brandProgress = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const cursorOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setCanRenderViewportGrid(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReducedMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      gridOpacity.setValue(0.5);
      blueprintOpacity.setValue(1);
      brandProgress.setValue(1);
      taglineOpacity.setValue(1);
      cursorOpacity.setValue(0);
      setSequenceComplete(true);
      return;
    }

    const intro = Animated.parallel([
      Animated.timing(gridOpacity, {
        duration: 1200,
        easing: Easing.out(Easing.quad),
        toValue: 0.5,
        useNativeDriver: false
      }),
      Animated.sequence([
        Animated.delay(250),
        Animated.timing(blueprintOpacity, {
          duration: 900,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: false
        })
      ]),
      Animated.sequence([
        Animated.delay(1700),
        Animated.timing(brandProgress, {
          duration: 900,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: false
        })
      ]),
      Animated.sequence([
        Animated.delay(3200),
        Animated.timing(taglineOpacity, {
          duration: 1000,
          easing: Easing.linear,
          toValue: 1,
          useNativeDriver: false
        })
      ])
    ]);
    const cursor = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          duration: 500,
          toValue: 1,
          useNativeDriver: false
        }),
        Animated.timing(cursorOpacity, {
          duration: 500,
          toValue: 0,
          useNativeDriver: false
        })
      ])
    );
    const completionTimer = setTimeout(
      () => setSequenceComplete(true),
      SPLASH_SEQUENCE_DURATION_MS
    );

    intro.start();
    cursor.start();

    return () => {
      clearTimeout(completionTimer);
      intro.stop();
      cursor.stop();
    };
  }, [
    blueprintOpacity,
    brandProgress,
    cursorOpacity,
    gridOpacity,
    reducedMotion,
    taglineOpacity
  ]);

  useEffect(() => {
    if (!canFinishSplash({ appReady, sequenceComplete })) {
      return;
    }

    const fade = Animated.timing(overlayOpacity, {
      duration: getSplashFadeDuration(reducedMotion),
      easing: Easing.out(Easing.quad),
      toValue: 0,
      useNativeDriver: false
    });

    fade.start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });

    return () => fade.stop();
  }, [appReady, onFinish, overlayOpacity, reducedMotion, sequenceComplete]);

  const verticalLineCount = canRenderViewportGrid
    ? Math.ceil(width / GRID_SIZE)
    : 0;
  const horizontalLineCount = canRenderViewportGrid
    ? Math.ceil(height / GRID_SIZE)
    : 0;
  const brandTranslateY = brandProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0]
  });

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.root, { opacity: overlayOpacity }]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: gridOpacity }]}
      >
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

      <Animated.View style={[styles.headerLeft, { opacity: blueprintOpacity }]}>
        <Text numberOfLines={1} style={styles.monoBlue}>
          ONZAIT_SPLASH.DWG
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.monoDim, styles.headerSecondLine]}
        >
          SCALE 1:1 · REV 04
        </Text>
      </Animated.View>

      <Animated.View
        style={[styles.bracketTopRight, { opacity: blueprintOpacity }]}
      />
      <Animated.View
        style={[styles.bracketBottomLeft, { opacity: blueprintOpacity }]}
      />

      <Animated.View
        style={[
          styles.center,
          {
            opacity: brandProgress,
            transform: [{ translateY: brandTranslateY }]
          }
        ]}
      >
        <Svg height={116} viewBox="-6 -6 230 238" width={112}>
          <Path d={MARK_TOP} fill={WHITE} />
          <Path d={MARK_BOTTOM} fill={BLUE} />
        </Svg>
        <View style={styles.dimensionRow}>
          <View style={styles.dimensionTick} />
          <View style={styles.dimensionBar} />
          <View style={styles.dimensionTick} />
        </View>
        <View style={styles.wordmarkRow}>
          {LETTERS.map((letter) => (
            <Text key={letter} style={styles.wordmark}>
              {letter}
            </Text>
          ))}
        </View>
      </Animated.View>

      <View style={styles.taglineRow}>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          BUILT FOR THE SITE
        </Animated.Text>
        <Animated.View style={[styles.cursor, { opacity: cursorOpacity }]} />
      </View>
    </Animated.View>
  );
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
  monoBlue: {
    color: BLUE_300,
    fontSize: 11,
    letterSpacing: 0.7,
    ...getMonoFontStyle("500")
  },
  monoDim: {
    color: INK_600,
    fontSize: 11,
    letterSpacing: 0.7,
    ...getMonoFontStyle("500")
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
    fontSize: 32,
    letterSpacing: 3.8,
    ...getSansFontStyle("900")
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
    fontSize: 12,
    letterSpacing: 1.2,
    ...getMonoFontStyle("500")
  },
  cursor: { backgroundColor: BLUE_300, height: 14, width: 7 }
});
