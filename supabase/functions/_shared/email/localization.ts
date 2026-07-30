import { createInstance } from "i18next";
import en from "./i18n/en.ts";
import es from "./i18n/es.ts";

export const emailLanguages = ["es", "en"] as const;
export type EmailLanguage = (typeof emailLanguages)[number];

export function resolveEmailLanguage(value: unknown): EmailLanguage {
  return value === "en" || value === "es" ? value : "es";
}

export function emailFormattingLocale(language: EmailLanguage) {
  return language === "es" ? "es-AR" : "en-US";
}

export async function createEmailTranslator(languageValue: unknown) {
  const language = resolveEmailLanguage(languageValue);
  const instance = createInstance();
  await instance.init({
    fallbackLng: "en",
    initAsync: false,
    interpolation: { escapeValue: false },
    lng: language,
    resources: {
      en: { email: en },
      es: { email: es },
    },
    supportedLngs: emailLanguages,
  });

  return {
    language,
    t: instance.getFixedT(language, "email"),
  };
}

export function formatEmailDate(value: string, language: EmailLanguage) {
  return new Intl.DateTimeFormat(emailFormattingLocale(language), {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
