import { useTradeCategories } from "@/features/trade-categories/hooks/use-trade-categories";
import {
  useCreateWorker,
  useUpdateWorker,
  useWorker
} from "@/features/workers/hooks/use-workers";
import WorkerFormScreen from "@/features/workers/screens/worker-form-screen";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockCreate = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), replace: mockReplace })
}));
jest.mock("@/features/workers/hooks/use-workers", () => ({
  useCreateWorker: jest.fn(),
  useUpdateWorker: jest.fn(),
  useWorker: jest.fn()
}));
jest.mock("@/features/trade-categories/hooks/use-trade-categories", () => ({
  useTradeCategories: jest.fn()
}));
jest.mock("@/features/contractors/components/contractor-picker-field", () => ({
  ContractorPickerField: () => null
}));
jest.mock("@/shared/ui/components/toast", () => ({
  useAppToast: jest.fn()
}));

describe("WorkerFormScreen", () => {
  beforeEach(() => {
    jest.mocked(useWorker).mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn()
    } as never);
    jest.mocked(useCreateWorker).mockReturnValue({
      isPending: false,
      mutateAsync: mockCreate
    } as never);
    jest.mocked(useUpdateWorker).mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn()
    } as never);
    jest.mocked(useTradeCategories).mockReturnValue({
      data: { pages: [{ items: [], nextOffset: null }] },
      hasNextPage: false,
      isError: false,
      isLoading: false
    } as never);
    jest.mocked(useAppToast).mockReturnValue({ show: jest.fn() });
    mockCreate.mockResolvedValue({
      first_name: "Alex",
      id: "worker-1",
      last_name: null
    });
  });

  it("creates a worker with empty optional relationships", async () => {
    await renderWithAppProviders(<WorkerFormScreen mode="create" />);

    await fireEvent.changeText(screen.getByPlaceholderText("Alex"), "Alex");
    await waitFor(() =>
      expect(screen.getByText("Create worker")).toBeEnabled()
    );
    await fireEvent.press(screen.getByText("Create worker"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        contractor_id: null,
        email: null,
        first_name: "Alex",
        last_name: null,
        phone_number: null,
        trade_category_ids: []
      });
      expect(mockReplace).toHaveBeenCalledWith("/workers/worker-1");
    });
  });
});
