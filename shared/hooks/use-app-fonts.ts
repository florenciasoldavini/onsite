import { useFonts } from "expo-font";

export function useAppFonts() {
  return useFonts({
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
}
