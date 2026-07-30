import AsyncStorage from "@react-native-async-storage/async-storage";

const languagePreferenceKey = "onzait.language";

export function readLanguagePreference() {
  return AsyncStorage.getItem(languagePreferenceKey);
}

export function writeLanguagePreference(language: string) {
  return AsyncStorage.setItem(languagePreferenceKey, language);
}
