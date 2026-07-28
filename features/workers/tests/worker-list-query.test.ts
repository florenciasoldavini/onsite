import {
  buildWorkerListQueryPlan,
  buildWorkerSearchFilter
} from "@/features/workers/repositories/worker-list-query";
import { describe, expect, it } from "vitest";

describe("worker list query", () => {
  it("scopes normal users to their own active workers", () => {
    expect(
      buildWorkerListQueryPlan({
        userId: "owner-1",
        userRole: "user"
      }).filters
    ).toEqual([
      { column: "deleted_at", operator: "is", value: null },
      { column: "owner_id", operator: "eq", value: "owner-1" }
    ]);
  });

  it("applies contractor and any-of trade filters", () => {
    expect(
      buildWorkerListQueryPlan({
        filters: {
          contractorId: "contractor-1",
          tradeCategoryIds: ["trade-2", "trade-1"]
        },
        userId: "owner-1",
        userRole: "user"
      }).filters
    ).toEqual([
      { column: "deleted_at", operator: "is", value: null },
      { column: "owner_id", operator: "eq", value: "owner-1" },
      {
        column: "contractor_id",
        operator: "eq",
        value: "contractor-1"
      },
      {
        column: "trade_filter.trade_category_id",
        operator: "in",
        value: ["trade-1", "trade-2"]
      }
    ]);
  });

  it("uses stable name ordering", () => {
    expect(
      buildWorkerListQueryPlan({
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
    expect(buildWorkerSearchFilter('A\\B"C')).toContain(
      'first_name.ilike."%A\\\\B\\"C%"'
    );
  });
});
