import {
  buildSupplierListQueryPlan,
  buildSupplierSearchFilter
} from "@/features/suppliers/repositories/supplier-list-query";

describe("supplier list query", () => {
  it("scopes normal users to their own active suppliers", () => {
    expect(
      buildSupplierListQueryPlan({
        userId: "owner-1",
        userRole: "user"
      }).filters
    ).toEqual([
      { column: "deleted_at", operator: "is", value: null },
      { column: "owner_id", operator: "eq", value: "owner-1" }
    ]);
  });

  it("lets admins query active suppliers across owners", () => {
    expect(
      buildSupplierListQueryPlan({
        userId: "admin-1",
        userRole: "admin"
      }).filters
    ).toEqual([{ column: "deleted_at", operator: "is", value: null }]);
  });

  it("uses stable name ordering", () => {
    expect(
      buildSupplierListQueryPlan({
        filters: { sort: "name_desc" },
        userId: "owner-1",
        userRole: "user"
      }).orders
    ).toEqual([
      { ascending: false, column: "name" },
      { ascending: true, column: "id" }
    ]);
  });

  it("searches all summary fields and escapes control characters", () => {
    const search = buildSupplierSearchFilter('A\\B"C');
    expect(search).toContain('name.ilike."%A\\\\B\\"C%"');
    expect(search).toContain("website_url.ilike.");
    expect(search).toContain("address.ilike.");
    expect(search).not.toContain("notes.ilike.");
  });
});
