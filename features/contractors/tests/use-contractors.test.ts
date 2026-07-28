import type { User } from "@/features/auth/types/auth.types";
import {
  useContractors,
  useCreateContractor,
  useSoftDeleteContractor
} from "@/features/contractors/hooks/use-contractors";
import {
  listContractors,
  softDeleteContractor
} from "@/features/contractors/services/contractors.service";
import {
  createTestQueryClient,
  renderHookWithAppProviders
} from "@/tests/support/render";
import { act, waitFor } from "@testing-library/react-native";

jest.mock("@/features/contractors/services/contractors.service", () => ({
  createContractor: jest.fn(),
  getContractor: jest.fn(),
  listContractors: jest.fn(),
  softDeleteContractor: jest.fn(),
  updateContractor: jest.fn()
}));

const user = {
  id: "owner-1",
  role: "user"
} as User;

describe("useContractors", () => {
  it("loads a bounded owner-scoped catalog page", async () => {
    jest.mocked(listContractors).mockResolvedValue({
      items: [],
      nextOffset: null
    });
    const queryClient = createTestQueryClient();
    const hook = await renderHookWithAppProviders(
      () => useContractors({ sort: "name_asc" }),
      { auth: { user }, queryClient }
    );

    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    expect(listContractors).toHaveBeenCalledWith({
      filters: { query: "", sort: "name_asc" },
      offset: 0,
      pageSize: 24,
      userId: "owner-1",
      userRole: "user"
    });
    await hook.unmount();
    queryClient.clear();
  });

  it("rejects creation without a session", async () => {
    const queryClient = createTestQueryClient();
    const hook = await renderHookWithAppProviders(
      () => useCreateContractor(),
      { queryClient }
    );

    await act(async () => {
      await expect(
        hook.result.current.mutateAsync({
          email: null,
          first_name: "Alex",
          last_name: null,
          phone_number: null
        })
      ).rejects.toThrow("You must be signed in to save contractors.");
    });
    await hook.unmount();
    queryClient.clear();
  });

  it("invalidates contractor and worker caches after deletion", async () => {
    jest.mocked(softDeleteContractor).mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const hook = await renderHookWithAppProviders(
      () => useSoftDeleteContractor(),
      { queryClient }
    );

    await act(async () => {
      await hook.result.current.mutateAsync("contractor-1");
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["contractors"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["workers"] });
    await hook.unmount();
    queryClient.clear();
  });
});
