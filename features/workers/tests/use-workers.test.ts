import type { User } from "@/features/auth/types/auth.types";
import {
  useSoftDeleteWorker,
  useWorkers
} from "@/features/workers/hooks/use-workers";
import {
  listWorkers,
  softDeleteWorker
} from "@/features/workers/services/workers.service";
import {
  createTestQueryClient,
  renderHookWithAppProviders
} from "@/tests/support/render";
import { act, waitFor } from "@testing-library/react-native";

jest.mock("@/features/workers/services/workers.service", () => ({
  createWorker: jest.fn(),
  getWorker: jest.fn(),
  listWorkers: jest.fn(),
  softDeleteWorker: jest.fn(),
  updateWorker: jest.fn()
}));

const user = { id: "owner-1", role: "admin" } as User;

describe("useWorkers", () => {
  it("passes bounded relationship filters to the service", async () => {
    jest.mocked(listWorkers).mockResolvedValue({
      items: [],
      nextOffset: null
    });
    const queryClient = createTestQueryClient();
    const hook = await renderHookWithAppProviders(
      () =>
        useWorkers({
          contractorId: "contractor-1",
          sort: "name_desc",
          tradeCategoryIds: ["trade-1"]
        }),
      { auth: { user }, queryClient }
    );

    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    expect(listWorkers).toHaveBeenCalledWith({
      filters: {
        contractorId: "contractor-1",
        query: "",
        sort: "name_desc",
        tradeCategoryIds: ["trade-1"]
      },
      offset: 0,
      pageSize: 24,
      userId: "owner-1",
      userRole: "admin"
    });
    await hook.unmount();
    queryClient.clear();
  });

  it("invalidates the worker catalog after deletion", async () => {
    jest.mocked(softDeleteWorker).mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const hook = await renderHookWithAppProviders(
      () => useSoftDeleteWorker(),
      { queryClient }
    );

    await act(async () => {
      await hook.result.current.mutateAsync("worker-1");
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["workers"] });
    await hook.unmount();
    queryClient.clear();
  });
});
