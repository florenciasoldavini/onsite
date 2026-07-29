import { listProjectPhotoRows } from "@/features/photos/repositories/photos.repository";
import { requireSupabase } from "@/infrastructure/supabase/repository";

jest.mock("@/infrastructure/supabase/repository", () => ({
  requireSupabase: jest.fn(),
  toRepositoryError: jest.fn((error) => error)
}));

describe("photos repository collaboration scope", () => {
  it("keeps pagination and project scope without an owner-only filter", async () => {
    const eq = jest.fn();
    const is = jest.fn();
    const order = jest.fn();
    const range = jest.fn().mockResolvedValue({ data: [], error: null });
    const query = { eq, is, order, range };
    eq.mockReturnValue(query);
    is.mockReturnValue(query);
    order.mockReturnValue(query);
    jest.mocked(requireSupabase).mockReturnValue({
      from: () => ({
        select: () => query
      })
    } as never);

    await listProjectPhotoRows({
      offset: 20,
      pageSize: 20,
      projectId: "project-1",
      userId: "member-1",
      userRole: "user"
    });

    expect(eq).toHaveBeenCalledWith("project_id", "project-1");
    expect(eq).not.toHaveBeenCalledWith("owner_id", expect.anything());
    expect(is).toHaveBeenCalledWith("deleted_at", null);
    expect(range).toHaveBeenCalledWith(20, 40);
  });
});
