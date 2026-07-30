import type { SupportedLanguage } from "@/features/localization/types/language";
import en from "@/features/trade-categories/i18n/en";
import es from "@/features/trade-categories/i18n/es";

const tradeCategoryLabels: Record<
  SupportedLanguage,
  Record<string, string>
> = {
  en: {
    ...en.labels
  },
  es: {
    ...es.labels
  }
};

export function getTradeCategoryLabel(
  code: string,
  language: SupportedLanguage = "en"
) {
  return (
    tradeCategoryLabels[language][code] ?? humanizeTradeCategoryCode(code)
  );
}

function humanizeTradeCategoryCode(code: string) {
  const label = code.replaceAll("_", " ").trim();
  return label ? `${label[0].toLocaleUpperCase()}${label.slice(1)}` : code;
}
