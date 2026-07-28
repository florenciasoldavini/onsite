import { useAuth } from "@/features/auth/hooks/use-auth";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createTestQueryClient,
  renderHookWithAppProviders,
  renderWithAppProviders
} from "./support/render";

function ProviderProbe() {
  const { isLoading } = useAuth();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Text>{isLoading ? "auth-loading" : "auth-ready"}</Text>
      <Text>{navigation ? "navigation-ready" : "navigation-missing"}</Text>
      <Text>
        {queryClient.getDefaultOptions().queries?.retry === false
          ? "query-ready"
          : "query-missing"}
      </Text>
      <Text>{`safe-area-${insets.top}`}</Text>
    </>
  );
}

describe("app test render harness", () => {
  it("provides the standard app contexts with deterministic defaults", async () => {
    await renderWithAppProviders(<ProviderProbe />);

    expect(screen.getByText("auth-ready")).toBeOnTheScreen();
    expect(screen.getByText("navigation-ready")).toBeOnTheScreen();
    expect(screen.getByText("query-ready")).toBeOnTheScreen();
    expect(screen.getByText("safe-area-47")).toBeOnTheScreen();
  });

  it("supports isolated hook rendering with provider overrides", async () => {
    const queryClient = createTestQueryClient();
    const { result } = await renderHookWithAppProviders(
      () => ({
        auth: useAuth(),
        queryClient: useQueryClient()
      }),
      {
        auth: { authError: "Test error" },
        queryClient
      }
    );

    expect(result.current.auth.authError).toBe("Test error");
    expect(result.current.queryClient).toBe(queryClient);
  });
});
