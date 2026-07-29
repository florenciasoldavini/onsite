import {
  useSoftDeleteWorker,
  useWorker
} from "@/features/workers/hooks/use-workers";
import WorkerDetailScreen from "@/features/workers/screens/worker-detail-screen";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockDelete = jest.fn();
const mockWorkerId = "40000000-0000-4000-8000-000000000001";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace })
}));
jest.mock("@/features/workers/hooks/use-workers", () => ({
  useSoftDeleteWorker: jest.fn(),
  useWorker: jest.fn()
}));
jest.mock("@/shared/hooks/use-layout-mode", () => ({
  useLayoutMode: jest.fn()
}));
jest.mock("@/shared/ui/components/toast", () => ({
  useAppToast: jest.fn()
}));

describe("WorkerDetailScreen", () => {
  beforeEach(() => {
    jest.mocked(useWorker).mockReturnValue({
      data: {
        contractor: null,
        email: null,
        first_name: "Alex",
        id: mockWorkerId,
        last_name: "Morgan",
        phone_number: null,
        trade_categories: []
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn()
    } as never);
    jest.mocked(useSoftDeleteWorker).mockReturnValue({
      isPending: false,
      mutateAsync: mockDelete
    } as never);
    jest.mocked(useLayoutMode).mockReturnValue({
      isCompact: true,
      isExpanded: false
    } as never);
    jest.mocked(useAppToast).mockReturnValue({ show: jest.fn() });
    mockDelete.mockResolvedValue(undefined);
  });

  it("requires confirmation before deleting a worker", async () => {
    await renderWithAppProviders(
      <WorkerDetailScreen workerId={mockWorkerId} />
    );

    await fireEvent.press(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete Alex Morgan?")).toBeOnTheScreen();
    expect(mockDelete).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole("button", { name: "Delete worker" })
    );

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(mockWorkerId);
      expect(mockReplace).toHaveBeenCalledWith("/directory?section=workers");
    });
  });
});
