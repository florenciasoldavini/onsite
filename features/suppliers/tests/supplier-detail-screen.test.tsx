import { useLocationMapPreview } from "@/features/locations/hooks/use-location-address";
import {
  useSoftDeleteSupplier,
  useSupplier
} from "@/features/suppliers/hooks/use-suppliers";
import SupplierDetailScreen from "@/features/suppliers/screens/supplier-detail-screen";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockDelete = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace })
}));
jest.mock("@/features/suppliers/hooks/use-suppliers", () => ({
  useSoftDeleteSupplier: jest.fn(),
  useSupplier: jest.fn()
}));
jest.mock("@/features/locations/hooks/use-location-address", () => ({
  useLocationMapPreview: jest.fn()
}));
jest.mock("@/shared/hooks/use-layout-mode", () => ({
  useLayoutMode: jest.fn()
}));
jest.mock("@/shared/ui/components/toast", () => ({
  useAppToast: jest.fn()
}));

describe("SupplierDetailScreen", () => {
  beforeEach(() => {
    jest.mocked(useSupplier).mockReturnValue({
      data: {
        address: null,
        contact_name: null,
        email: null,
        id: "supplier-1",
        latitude: null,
        longitude: null,
        name: "Patagonia Supply",
        notes: null,
        phone_number: null,
        website_url: null
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn()
    } as never);
    jest.mocked(useSoftDeleteSupplier).mockReturnValue({
      isPending: false,
      mutateAsync: mockDelete
    } as never);
    jest.mocked(useLocationMapPreview).mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false
    } as never);
    jest.mocked(useLayoutMode).mockReturnValue({ isCompact: true } as never);
    jest.mocked(useAppToast).mockReturnValue({ show: jest.fn() });
    mockDelete.mockResolvedValue(undefined);
  });

  it("requires confirmation before deleting a supplier", async () => {
    await renderWithAppProviders(
      <SupplierDetailScreen supplierId="supplier-1" />
    );

    await fireEvent.press(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete Patagonia Supply?")).toBeOnTheScreen();
    expect(mockDelete).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole("button", { name: "Delete supplier" })
    );

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("supplier-1");
      expect(mockReplace).toHaveBeenCalledWith(
        "/directory?section=suppliers"
      );
    });
  });
});
