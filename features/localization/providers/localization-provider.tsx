import { LocalizationContext } from "@/features/localization/providers/localization-context";
import {
  detectDeviceLanguage,
  persistLanguagePreference,
  resolveInitialLanguage
} from "@/features/localization/services/localization.service";
import { appI18n, initializeI18n } from "@/features/localization/services/i18n";
import {
  defaultLanguage,
  formattingLocales,
  type SupportedLanguage
} from "@/features/localization/types/language";
import { Sentry } from "@/infrastructure/monitoring/sentry";
import { setUserFacingErrorLanguage } from "@/shared/utils/user-facing-errors";
import { I18nextProvider } from "react-i18next";
import { AppState, Platform, type AppStateStatus } from "react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [hasExplicitPreference, setHasExplicitPreference] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const explicitPreferenceRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    void resolveInitialLanguage()
      .then(async (resolution) => {
        await initializeI18n(resolution.language);
        if (mounted) {
          setUserFacingErrorLanguage(resolution.language);
          explicitPreferenceRef.current = resolution.hasExplicitPreference;
          setHasExplicitPreference(resolution.hasExplicitPreference);
          setLanguage(resolution.language);
        }
      })
      .catch(async (error) => {
        Sentry.captureException(error);
        await initializeI18n(defaultLanguage);
        if (mounted) {
          setUserFacingErrorLanguage(defaultLanguage);
          setLanguage(defaultLanguage);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || !isReady) {
      return;
    }

    document.documentElement.lang = language;
  }, [isReady, language]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const onAppStateChange = (state: AppStateStatus) => {
      if (state !== "active" || explicitPreferenceRef.current) {
        return;
      }

      const detectedLanguage = detectDeviceLanguage();
      if (detectedLanguage !== language) {
        void appI18n.changeLanguage(detectedLanguage).then(() => {
          setUserFacingErrorLanguage(detectedLanguage);
          setLanguage(detectedLanguage);
        });
      }
    };

    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, [language]);

  const changeLanguage = useCallback(
    async (nextLanguage: SupportedLanguage) => {
      await appI18n.changeLanguage(nextLanguage);
      setUserFacingErrorLanguage(nextLanguage);
      setLanguage(nextLanguage);
      setHasExplicitPreference(true);
      explicitPreferenceRef.current = true;

      try {
        await persistLanguagePreference(nextLanguage);
      } catch (error) {
        Sentry.captureException(error);
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      changeLanguage,
      formattingLocale: formattingLocales[language],
      hasExplicitPreference,
      isReady,
      language
    }),
    [changeLanguage, hasExplicitPreference, isReady, language]
  );

  return (
    <LocalizationContext.Provider value={value}>
      <I18nextProvider i18n={appI18n}>{children}</I18nextProvider>
    </LocalizationContext.Provider>
  );
}
