import { listProjectDocumentRows } from "@/features/documents/repositories/documents.repository";
import { requireSupabase } from "@/infrastructure/supabase/repository";

jest.mock("@/infrastructure/supabase/repository", () => ({
  requireSupabase: jest.fn(),
  toRepositoryError: jest.fn((error) => error)
}));

describe("project documents repository", () => {
  it("uses project scope, active rows, filters, deterministic order, and bounded pages", async () => {
    const eq = jest.fn();
    const is = jest.fn();
    const or = jest.fn();
    const order = jest.fn();
    const range = jest.fn().mockResolvedValue({ data: [], error: null });
    const query = { eq, is, or, order, range };
    eq.mockReturnValue(query);
    is.mockReturnValue(query);
    or.mockReturnValue(query);
    order.mockReturnValue(query);
    jest.mocked(requireSupabase).mockReturnValue({
      from: () => ({
        select: () => query
      })
    } as never);

    await listProjectDocumentRows({
      filters: { category: "permit", query: "approved" },
      offset: 25,
      pageSize: 25,
      projectId: "project-id"
    });

    expect(eq).toHaveBeenCalledWith("project_id", "project-id");
    expect(eq).toHaveBeenCalledWith("category", "permit");
    expect(is).toHaveBeenCalledWith("deleted_at", null);
    expect(or).toHaveBeenCalledWith(
      'name.ilike."%approved%",original_filename.ilike."%approved%"'
    );
    expect(order).toHaveBeenNthCalledWith(1, "created_at", {
      ascending: false
    });
    expect(order).toHaveBeenNthCalledWith(2, "id", {
      ascending: false
    });
    expect(range).toHaveBeenCalledWith(25, 50);
  });
});
