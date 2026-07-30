export const supportedLanguages = ["es", "en"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = "es";
export const fallbackLanguage: SupportedLanguage = "en";

export const formattingLocales = {
  en: "en-US",
  es: "es-AR"
} as const satisfies Record<SupportedLanguage, string>;

export function isSupportedLanguage(
  value: unknown
): value is SupportedLanguage {
  return (
    typeof value === "string" &&
    supportedLanguages.includes(value as SupportedLanguage)
  );
}

export function resolveSupportedLanguage(
  value: string | null | undefined
): SupportedLanguage | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase().split(/[-_]/)[0];
  return isSupportedLanguage(normalized) ? normalized : null;
}
