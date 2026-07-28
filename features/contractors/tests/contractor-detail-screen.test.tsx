import {
  useContractor,
  useSoftDeleteContractor
} from "@/features/contractors/hooks/use-contractors";
import ContractorDetailScreen from "@/features/contractors/screens/contractor-detail-screen";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockDelete = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ contractorId: "contractor-1" }),
  useRouter: () => ({ push: jest.fn(), replace: mockReplace })
}));
jest.mock("@/features/contractors/hooks/use-contractors", () => ({
  useContractor: jest.fn(),
  useSoftDeleteContractor: jest.fn()
}));
jest.mock("@/shared/hooks/use-layout-mode", () => ({
  useLayoutMode: jest.fn()
}));
jest.mock("@/shared/ui/components/toast", () => ({
  useAppToast: jest.fn()
}));

describe("ContractorDetailScreen", () => {
  beforeEach(() => {
    jest.mocked(useContractor).mockReturnValue({
      data: {
        email: "alex@example.com",
        first_name: "Alex",
        id: "contractor-1",
        last_name: "Morgan",
        phone_number: null
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn()
    } as never);
    jest.mocked(useSoftDeleteContractor).mockReturnValue({
      isPending: false,
      mutateAsync: mockDelete
    } as never);
    jest.mocked(useLayoutMode).mockReturnValue({ isCompact: true } as never);
    jest.mocked(useAppToast).mockReturnValue({ show: jest.fn() });
    mockDelete.mockResolvedValue(undefined);
  });

  it("requires confirmation before deleting a contractor", async () => {
    await renderWithAppProviders(<ContractorDetailScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete Alex Morgan?")).toBeOnTheScreen();
    expect(mockDelete).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole("button", { name: "Delete contractor" })
    );

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("contractor-1");
      expect(mockReplace).toHaveBeenCalledWith(
        "/directory?section=contractors"
      );
    });
  });
});
