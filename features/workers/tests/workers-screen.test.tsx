import { useWorkers } from "@/features/workers/hooks/use-workers";
import WorkersScreen from "@/features/workers/screens/workers-screen";
import { useContractors } from "@/features/contractors/hooks/use-contractors";
import { useTradeCategories } from "@/features/trade-categories/hooks/use-trade-categories";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen } from "@testing-library/react-native";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush })
}));
jest.mock("@/features/workers/hooks/use-workers", () => ({
  useWorkers: jest.fn()
}));
jest.mock("@/features/contractors/hooks/use-contractors", () => ({
  useContractors: jest.fn()
}));
jest.mock("@/features/trade-categories/hooks/use-trade-categories", () => ({
  useTradeCategories: jest.fn()
}));
jest.mock("@/shared/hooks/use-layout-mode", () => ({
  useLayoutMode: jest.fn()
}));

describe("WorkersScreen", () => {
  beforeEach(() => {
    jest.mocked(useLayoutMode).mockReturnValue({
      isCompact: false,
      isExpanded: false
    } as never);
    jest.mocked(useWorkers).mockReturnValue({
      data: { pages: [{ items: [], nextOffset: null }] },
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
      refetch: jest.fn()
    } as never);
    jest.mocked(useContractors).mockReturnValue({
      data: { pages: [{ items: [], nextOffset: null }] },
      isError: false,
      isLoading: false
    } as never);
    jest.mocked(useTradeCategories).mockReturnValue({
      data: { pages: [{ items: [], nextOffset: null }] },
      isError: false,
      isLoading: false
    } as never);
  });

  it("shows the empty catalog action and applies search input", async () => {
    await renderWithAppProviders(<WorkersScreen />);

    expect(screen.getByText("No workers yet")).toBeOnTheScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText("Search workers"),
      "alex"
    );
    expect(useWorkers).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: "alex", sort: "created_desc" })
    );
    await fireEvent.press(screen.getByText("New worker"));
    expect(mockPush).toHaveBeenCalledWith("/workers/new");
  });
});
