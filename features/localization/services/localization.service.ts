import {
  readLanguagePreference,
  writeLanguagePreference
} from "@/features/localization/repositories/language-preference.repository";
import {
  defaultLanguage,
  isSupportedLanguage,
  resolveSupportedLanguage,
  type SupportedLanguage
} from "@/features/localization/types/language";
import { getLocales } from "expo-localization";

const preferenceReadTimeoutMs = 1500;

export type LanguageResolution = {
  hasExplicitPreference: boolean;
  language: SupportedLanguage;
};

export function detectDeviceLanguage(): SupportedLanguage {
  try {
    const locale = getLocales()[0];
    return (
      resolveSupportedLanguage(locale?.languageCode ?? locale?.languageTag) ??
      defaultLanguage
    );
  } catch {
    return defaultLanguage;
  }
}

export async function resolveInitialLanguage(): Promise<LanguageResolution> {
  try {
    const storedLanguage = await withTimeout(
      readLanguagePreference(),
      preferenceReadTimeoutMs
    );

    if (isSupportedLanguage(storedLanguage)) {
      return {
        hasExplicitPreference: true,
        language: storedLanguage
      };
    }
  } catch {
    // Preference failures are non-fatal; device detection remains available.
  }

  return {
    hasExplicitPreference: false,
    language: detectDeviceLanguage()
  };
}

export async function persistLanguagePreference(
  language: SupportedLanguage
) {
  await writeLanguagePreference(language);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Language preference read timed out.")),
      timeoutMs
    );

    void promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}
