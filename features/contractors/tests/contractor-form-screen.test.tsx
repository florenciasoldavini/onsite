import {
  useContractor,
  useCreateContractor,
  useUpdateContractor
} from "@/features/contractors/hooks/use-contractors";
import ContractorFormScreen from "@/features/contractors/screens/contractor-form-screen";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRefetch = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), replace: mockReplace })
}));
jest.mock("@/features/contractors/hooks/use-contractors", () => ({
  useContractor: jest.fn(),
  useCreateContractor: jest.fn(),
  useUpdateContractor: jest.fn()
}));
jest.mock("@/shared/ui/components/toast", () => ({
  useAppToast: jest.fn()
}));

describe("ContractorFormScreen", () => {
  beforeEach(() => {
    jest.mocked(useContractor).mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    jest.mocked(useCreateContractor).mockReturnValue({
      isPending: false,
      mutateAsync: mockCreate
    } as never);
    jest.mocked(useUpdateContractor).mockReturnValue({
      isPending: false,
      mutateAsync: mockUpdate
    } as never);
    jest.mocked(useAppToast).mockReturnValue({ show: jest.fn() });
    mockCreate.mockResolvedValue({
      first_name: "Alex",
      id: "contractor-1",
      last_name: null
    });
  });

  it("creates a contractor from valid required input", async () => {
    await renderWithAppProviders(<ContractorFormScreen mode="create" />);

    expect(screen.getByText("Create contractor")).toBeDisabled();
    await fireEvent.changeText(screen.getByPlaceholderText("Alex"), "Alex");
    await waitFor(() =>
      expect(screen.getByText("Create contractor")).toBeEnabled()
    );
    await fireEvent.press(screen.getByText("Create contractor"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        email: null,
        first_name: "Alex",
        last_name: null,
        phone_number: null
      });
      expect(mockReplace).toHaveBeenCalledWith(
        "/contractors/contractor-1"
      );
    });
  });

  it("retries an unavailable edit target", async () => {
    jest.mocked(useContractor).mockReturnValue({
      data: undefined,
      error: new Error("database details"),
      isError: true,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    await renderWithAppProviders(
      <ContractorFormScreen contractorId="contractor-1" mode="edit" />
    );

    expect(screen.getByText("Contractor unavailable")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Retry"));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
