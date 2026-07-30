import {
  defaultLanguage,
  formattingLocales,
  type SupportedLanguage
} from "@/features/localization/types/language";
import { createContext } from "react";

export type LocalizationContextValue = {
  changeLanguage: (language: SupportedLanguage) => Promise<void>;
  formattingLocale: string;
  hasExplicitPreference: boolean;
  isReady: boolean;
  language: SupportedLanguage;
};

export const LocalizationContext = createContext<LocalizationContextValue>({
  changeLanguage: async () => {},
  formattingLocale: formattingLocales[defaultLanguage],
  hasExplicitPreference: false,
  isReady: false,
  language: defaultLanguage
});
