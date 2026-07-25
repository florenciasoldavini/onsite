// app/_layout.tsx
import { GluestackUIProvider } from "@/shared/ui/primitives/gluestack-ui-provider";
import { AnimatedSplash } from "@/shared/splash/animated-splash";
import { AuthProvider } from "@/features/auth/providers/auth-provider";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { queryClient } from "@/infrastructure/query/client";
import {
  navigationIntegration,
  Sentry
} from "@/infrastructure/monitoring/sentry";
import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useNavigationContainerRef } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

if (process.env.EXPO_OS !== "web") {
  void SplashScreen.preventAutoHideAsync();
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist: require("@/assets/fonts/Geist-Regular.ttf"),
    "Geist-Regular": require("@/assets/fonts/Geist-Regular.ttf"),
    "Geist-Medium": require("@/assets/fonts/Geist-Medium.ttf"),
    "Geist-SemiBold": require("@/assets/fonts/Geist-SemiBold.ttf"),
    "Geist-Bold": require("@/assets/fonts/Geist-Bold.ttf"),
    "Geist-Black": require("@/assets/fonts/Geist-Black.ttf"),
    "JetBrains Mono": require("@/assets/fonts/JetBrainsMono-Regular.ttf"),
    "JetBrainsMono-Regular": require("@/assets/fonts/JetBrainsMono-Regular.ttf"),
    "JetBrainsMono-Medium": require("@/assets/fonts/JetBrainsMono-Medium.ttf"),
    "JetBrainsMono-SemiBold": require("@/assets/fonts/JetBrainsMono-SemiBold.ttf"),
    "JetBrainsMono-Bold": require("@/assets/fonts/JetBrainsMono-Bold.ttf")
  });

  useEffect(() => {
    if (fontError) {
      Sentry.captureException(fontError);
    }
  }, [fontError]);

  const canRenderWithFonts =
    process.env.EXPO_OS === "web" || fontsLoaded || Boolean(fontError);

  if (!canRenderWithFonts) {
    return null;
  }

  return (
    <GluestackUIProvider mode="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            <RootNavigator />
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}

function RootNavigator() {
  const { isLoading, session } = useAuth();
  const navigationRef = useNavigationContainerRef();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  useEffect(() => {
    navigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);

  return (
    <>
      {!isLoading ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={Boolean(session)}>
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={!session}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      ) : null}
      {!splashDone ? (
        <AnimatedSplash appReady={!isLoading} onFinish={handleSplashFinish} />
      ) : null}
    </>
  );
}

export default Sentry.wrap(RootLayout);
