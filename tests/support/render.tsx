import {
  AuthContext,
  type AuthContextValue
} from "@/features/auth/providers/auth-context";
import { GluestackUIProvider } from "@/shared/ui/primitives/gluestack-ui-provider";
import { setUserFacingErrorLanguage } from "@/shared/utils/user-facing-errors";
import { LocalizationContext } from "@/features/localization/providers/localization-context";
import { localizationResources } from "@/features/localization/i18n/resources";
import {
  formattingLocales,
  type SupportedLanguage
} from "@/features/localization/types/language";
import { NavigationContainer } from "@react-navigation/native";
import {
  QueryClient,
  QueryClientProvider,
  type DefaultOptions
} from "@tanstack/react-query";
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions
} from "@testing-library/react-native";
import type { PropsWithChildren, ReactElement } from "react";
import { useMemo, useState } from "react";
import { SafeAreaProvider, type Metrics } from "react-native-safe-area-context";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";

const defaultQueryOptions: DefaultOptions = {
  mutations: {
    gcTime: Infinity,
    retry: false
  },
  queries: {
    gcTime: Infinity,
    retry: false
  }
};

const defaultAuthValue: AuthContextValue = {
  authError: null,
  createUser: async () => null,
  isLoading: false,
  logOut: async () => {},
  session: null,
  updateUserProfile: async () => null,
  user: null
};

const defaultSafeAreaMetrics: Metrics = {
  frame: {
    height: 844,
    width: 390,
    x: 0,
    y: 0
  },
  insets: {
    bottom: 34,
    left: 0,
    right: 0,
    top: 47
  }
};

export function createTestQueryClient(defaultOptions = defaultQueryOptions) {
  return new QueryClient({ defaultOptions });
}

interface AppTestProviderOptions {
  auth?: Partial<AuthContextValue>;
  includeNavigation?: boolean;
  language?: SupportedLanguage;
  queryClient?: QueryClient;
  safeAreaMetrics?: Metrics;
}

function createAppTestWrapper({
  auth,
  includeNavigation = true,
  language: initialLanguage = "en",
  queryClient = createTestQueryClient(),
  safeAreaMetrics = defaultSafeAreaMetrics
}: AppTestProviderOptions = {}) {
  setUserFacingErrorLanguage(initialLanguage);
  const i18n = createInstance();
  void i18n.use(initReactI18next).init({
    fallbackLng: "en",
    enableSelector: "strict",
    initAsync: false,
    interpolation: { escapeValue: false },
    lng: initialLanguage,
    resources: localizationResources,
    supportedLngs: ["es", "en"]
  });

  return function AppTestWrapper({ children }: PropsWithChildren) {
    const [language, setLanguage] =
      useState<SupportedLanguage>(initialLanguage);
    const localizationValue = useMemo(
      () => ({
        changeLanguage: async (nextLanguage: SupportedLanguage) => {
          await i18n.changeLanguage(nextLanguage);
          setUserFacingErrorLanguage(nextLanguage);
          setLanguage(nextLanguage);
        },
        formattingLocale: formattingLocales[language],
        hasExplicitPreference: true,
        isReady: true,
        language
      }),
      [language]
    );
    const content = includeNavigation ? (
      <NavigationContainer>{children}</NavigationContainer>
    ) : (
      children
    );

    return (
      <I18nextProvider i18n={i18n}>
        <LocalizationContext.Provider value={localizationValue}>
          <GluestackUIProvider mode="light">
            <SafeAreaProvider initialMetrics={safeAreaMetrics}>
              <QueryClientProvider client={queryClient}>
                <AuthContext.Provider value={{ ...defaultAuthValue, ...auth }}>
                  {content}
                </AuthContext.Provider>
              </QueryClientProvider>
            </SafeAreaProvider>
          </GluestackUIProvider>
        </LocalizationContext.Provider>
      </I18nextProvider>
    );
  };
}

export function renderWithAppProviders(
  ui: ReactElement,
  options: RenderOptions & AppTestProviderOptions = {}
) {
  const {
    auth,
    includeNavigation,
    language,
    queryClient,
    safeAreaMetrics,
    ...renderOptions
  } = options;

  return render(ui, {
    wrapper: createAppTestWrapper({
      auth,
      includeNavigation,
      language,
      queryClient,
      safeAreaMetrics
    }),
    ...renderOptions
  });
}

export function renderHookWithAppProviders<Result, Props>(
  callback: (props: Props) => Result,
  options: RenderHookOptions<Props> & AppTestProviderOptions = {}
) {
  const {
    auth,
    includeNavigation,
    language,
    queryClient,
    safeAreaMetrics,
    ...renderHookOptions
  } = options;

  return renderHook(callback, {
    wrapper: createAppTestWrapper({
      auth,
      includeNavigation,
      language,
      queryClient,
      safeAreaMetrics
    }),
    ...renderHookOptions
  });
}
