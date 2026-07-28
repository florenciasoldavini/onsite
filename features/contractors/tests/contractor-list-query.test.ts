import {
  buildContractorListQueryPlan,
  buildContractorSearchFilter
} from "@/features/contractors/repositories/contractor-list-query";
import { describe, expect, it } from "vitest";

describe("contractor list query", () => {
  it("scopes normal users to their own active contractors", () => {
    expect(
      buildContractorListQueryPlan({
        userId: "owner-1",
        userRole: "user"
      }).filters
    ).toEqual([
      { column: "deleted_at", operator: "is", value: null },
      { column: "owner_id", operator: "eq", value: "owner-1" }
    ]);
  });

  it("lets admins query active contractors across owners", () => {
    expect(
      buildContractorListQueryPlan({
        userId: "admin-1",
        userRole: "admin"
      }).filters
    ).toEqual([{ column: "deleted_at", operator: "is", value: null }]);
  });

  it("lets admins explicitly scope a contractor picker by owner", () => {
    expect(
      buildContractorListQueryPlan({
        filters: { ownerId: "owner-1" },
        userId: "admin-1",
        userRole: "admin"
      }).filters
    ).toEqual([
      { column: "deleted_at", operator: "is", value: null },
      { column: "owner_id", operator: "eq", value: "owner-1" }
    ]);
  });

  it("uses stable name ordering", () => {
    expect(
      buildContractorListQueryPlan({
        filters: { sort: "name_desc" },
        userId: "owner-1",
        userRole: "user"
      }).orders
    ).toEqual([
      { ascending: false, column: "first_name" },
      { ascending: false, column: "last_name" },
      { ascending: true, column: "id" }
    ]);
  });

  it("escapes search control characters", () => {
    expect(buildContractorSearchFilter('A\\B"C')).toContain(
      'first_name.ilike."%A\\\\B\\"C%"'
    );
  });
});
