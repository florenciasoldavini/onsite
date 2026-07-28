import { useContractors } from "@/features/contractors/hooks/use-contractors";
import ContractorsScreen from "@/features/contractors/screens/contractors-screen";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen } from "@testing-library/react-native";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush })
}));
jest.mock("@/features/contractors/hooks/use-contractors", () => ({
  useContractors: jest.fn()
}));
jest.mock("@/shared/hooks/use-layout-mode", () => ({
  useLayoutMode: jest.fn()
}));

describe("ContractorsScreen", () => {
  beforeEach(() => {
    jest.mocked(useLayoutMode).mockReturnValue({
      isCompact: false,
      isExpanded: false
    } as never);
    jest.mocked(useContractors).mockReturnValue({
      data: { pages: [{ items: [], nextOffset: null }] },
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
      refetch: jest.fn()
    } as never);
  });

  it("shows the empty catalog action and applies search input", async () => {
    await renderWithAppProviders(<ContractorsScreen />);

    expect(screen.getByText("No contractors yet")).toBeOnTheScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText("Search contractors"),
      "morgan"
    );
    expect(useContractors).toHaveBeenLastCalledWith({
      query: "morgan",
      sort: "created_desc"
    });
    await fireEvent.press(screen.getByText("New contractor"));
    expect(mockPush).toHaveBeenCalledWith("/contractors/new");
  });
});
