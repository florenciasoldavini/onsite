import { localizationResources } from "@/features/localization/i18n/resources";
import {
  defaultLanguage,
  fallbackLanguage,
  supportedLanguages
} from "@/features/localization/types/language";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

export const appI18n = createInstance();

void appI18n.use(initReactI18next).init({
  debug: false,
  enableSelector: "strict",
  fallbackLng: fallbackLanguage,
  initAsync: false,
  interpolation: {
    escapeValue: false,
    skipOnVariables: true
  },
  lng: defaultLanguage,
  react: {
    useSuspense: false
  },
  resources: localizationResources,
  returnNull: false,
  saveMissing: false,
  supportedLngs: [...supportedLanguages],
  updateMissing: false
});

export async function initializeI18n(language: "es" | "en") {
  await appI18n.changeLanguage(language);
}
