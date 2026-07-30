const languagePreferenceKey = "onzait.language";

export async function readLanguagePreference() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(languagePreferenceKey);
}

export async function writeLanguagePreference(language: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(languagePreferenceKey, language);
  }
}
