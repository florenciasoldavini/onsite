import type { User } from "@/features/auth/types/auth.types";
import {
  useSoftDeleteSupplier,
  useSuppliers
} from "@/features/suppliers/hooks/use-suppliers";
import {
  listSuppliers,
  softDeleteSupplier
} from "@/features/suppliers/services/suppliers.service";
import {
  createTestQueryClient,
  renderHookWithAppProviders
} from "@/tests/support/render";
import { act, waitFor } from "@testing-library/react-native";

jest.mock("@/features/suppliers/services/suppliers.service", () => ({
  createSupplier: jest.fn(),
  getSupplier: jest.fn(),
  listSuppliers: jest.fn(),
  softDeleteSupplier: jest.fn(),
  updateSupplier: jest.fn()
}));

const user = { id: "owner-1", role: "user" } as User;

describe("useSuppliers", () => {
  it("loads a bounded owner-scoped catalog page", async () => {
    jest.mocked(listSuppliers).mockResolvedValue({
      items: [],
      nextOffset: null
    });
    const queryClient = createTestQueryClient();
    const hook = await renderHookWithAppProviders(
      () => useSuppliers({ sort: "created_asc" }),
      { auth: { user }, queryClient }
    );

    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    expect(listSuppliers).toHaveBeenCalledWith({
      filters: { query: "", sort: "created_asc" },
      offset: 0,
      pageSize: 24,
      userId: "owner-1",
      userRole: "user"
    });
    await hook.unmount();
    queryClient.clear();
  });

  it("invalidates the supplier catalog after deletion", async () => {
    jest.mocked(softDeleteSupplier).mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const hook = await renderHookWithAppProviders(
      () => useSoftDeleteSupplier(),
      { queryClient }
    );

    await act(async () => {
      await hook.result.current.mutateAsync("supplier-1");
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["suppliers"] });
    await hook.unmount();
    queryClient.clear();
  });
});
