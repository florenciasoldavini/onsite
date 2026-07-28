import {
  useCreateSupplier,
  useSupplier,
  useUpdateSupplier
} from "@/features/suppliers/hooks/use-suppliers";
import SupplierFormScreen from "@/features/suppliers/screens/supplier-form-screen";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockCreate = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), replace: mockReplace })
}));
jest.mock("@/features/suppliers/hooks/use-suppliers", () => ({
  useCreateSupplier: jest.fn(),
  useSupplier: jest.fn(),
  useUpdateSupplier: jest.fn()
}));
jest.mock("@/features/suppliers/components/supplier-address-field", () => ({
  SupplierAddressField: () => null
}));
jest.mock("@/shared/ui/components/toast", () => ({
  useAppToast: jest.fn()
}));

describe("SupplierFormScreen", () => {
  beforeEach(() => {
    jest.mocked(useSupplier).mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn()
    } as never);
    jest.mocked(useCreateSupplier).mockReturnValue({
      isPending: false,
      mutateAsync: mockCreate
    } as never);
    jest.mocked(useUpdateSupplier).mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn()
    } as never);
    jest.mocked(useAppToast).mockReturnValue({ show: jest.fn() });
    mockCreate.mockResolvedValue({
      id: "supplier-1",
      name: "Patagonia Building Supply"
    });
  });

  it("creates a supplier with normalized optional values", async () => {
    await renderWithAppProviders(<SupplierFormScreen mode="create" />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Patagonia Building Supply"),
      "Patagonia Building Supply"
    );
    await waitFor(() =>
      expect(screen.getByText("Create supplier")).toBeEnabled()
    );
    await fireEvent.press(screen.getByText("Create supplier"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        address: null,
        contact_name: null,
        email: null,
        google_place_id: null,
        latitude: null,
        longitude: null,
        name: "Patagonia Building Supply",
        notes: null,
        phone_number: null,
        website_url: null
      });
      expect(mockReplace).toHaveBeenCalledWith("/suppliers/supplier-1");
    });
  });
});
