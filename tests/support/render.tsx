import {
  AuthContext,
  type AuthContextValue
} from "@/features/auth/providers/auth-context";
import { GluestackUIProvider } from "@/shared/ui/primitives/gluestack-ui-provider";
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
import { SafeAreaProvider, type Metrics } from "react-native-safe-area-context";

const defaultQueryOptions: DefaultOptions = {
  mutations: {
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
  queryClient?: QueryClient;
  safeAreaMetrics?: Metrics;
}

function createAppTestWrapper({
  auth,
  includeNavigation = true,
  queryClient = createTestQueryClient(),
  safeAreaMetrics = defaultSafeAreaMetrics
}: AppTestProviderOptions = {}) {
  return function AppTestWrapper({ children }: PropsWithChildren) {
    const content = includeNavigation ? (
      <NavigationContainer>{children}</NavigationContainer>
    ) : (
      children
    );

    return (
      <GluestackUIProvider mode="light">
        <SafeAreaProvider initialMetrics={safeAreaMetrics}>
          <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={{ ...defaultAuthValue, ...auth }}>
              {content}
            </AuthContext.Provider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GluestackUIProvider>
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
    queryClient,
    safeAreaMetrics,
    ...renderOptions
  } = options;

  return render(ui, {
    wrapper: createAppTestWrapper({
      auth,
      includeNavigation,
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
    queryClient,
    safeAreaMetrics,
    ...renderHookOptions
  } = options;

  return renderHook(callback, {
    wrapper: createAppTestWrapper({
      auth,
      includeNavigation,
      queryClient,
      safeAreaMetrics
    }),
    ...renderHookOptions
  });
}
