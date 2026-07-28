import type { User } from "@/features/auth/types/auth.types";
import { useTradeCategories } from "@/features/trade-categories/hooks/use-trade-categories";
import { listTradeCategories } from "@/features/trade-categories/services/trade-categories.service";
import {
  createTestQueryClient,
  renderHookWithAppProviders
} from "@/tests/support/render";
import { waitFor } from "@testing-library/react-native";

jest.mock(
  "@/features/trade-categories/services/trade-categories.service",
  () => ({
    listTradeCategories: jest.fn()
  })
);

describe("useTradeCategories", () => {
  it("stays idle without a profile and pages the catalog when signed in", async () => {
    const queryClient = createTestQueryClient();
    const disabled = await renderHookWithAppProviders(
      () => useTradeCategories(),
      { queryClient }
    );
    expect(disabled.result.current.fetchStatus).toBe("idle");
    await disabled.unmount();

    jest.mocked(listTradeCategories).mockResolvedValue({
      items: [],
      nextOffset: null
    });
    const enabled = await renderHookWithAppProviders(
      () => useTradeCategories(),
      {
        auth: { user: { id: "owner-1" } as User },
        queryClient
      }
    );
    await waitFor(() => expect(enabled.result.current.isSuccess).toBe(true));
    expect(listTradeCategories).toHaveBeenCalledWith({
      offset: 0,
      pageSize: 24
    });
    await enabled.unmount();
    queryClient.clear();
  });
});
