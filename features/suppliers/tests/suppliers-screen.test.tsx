import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers";
import SuppliersScreen from "@/features/suppliers/screens/suppliers-screen";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen } from "@testing-library/react-native";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush })
}));
jest.mock("@/features/suppliers/hooks/use-suppliers", () => ({
  useSuppliers: jest.fn()
}));
jest.mock("@/shared/hooks/use-layout-mode", () => ({
  useLayoutMode: jest.fn()
}));

describe("SuppliersScreen", () => {
  beforeEach(() => {
    jest.mocked(useLayoutMode).mockReturnValue({
      isCompact: false,
      isExpanded: false
    } as never);
    jest.mocked(useSuppliers).mockReturnValue({
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
    await renderWithAppProviders(<SuppliersScreen />);

    expect(screen.getByText("No suppliers yet")).toBeOnTheScreen();
    await fireEvent.changeText(
      screen.getByPlaceholderText("Search suppliers"),
      "patagonia"
    );
    expect(useSuppliers).toHaveBeenLastCalledWith({
      query: "patagonia",
      sort: "created_desc"
    });
    await fireEvent.press(screen.getByText("New supplier"));
    expect(mockPush).toHaveBeenCalledWith("/suppliers/new");
  });
});
