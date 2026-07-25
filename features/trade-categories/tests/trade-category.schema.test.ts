import { TradeCategorySchema } from "@/features/trade-categories/schemas/trade-category.schema";
import { describe, expect, it } from "vitest";

describe("TradeCategorySchema", () => {
  it("accepts a database trade-category row", () => {
    expect(
      TradeCategorySchema.safeParse({
        code: "carpentry_woodwork",
        created_at: "2026-07-25T15:00:00.000",
        deleted_at: null,
        id: "20000000-0000-4000-8000-000000000001",
        updated_at: null
      }).success
    ).toBe(true);
  });

  it("rejects an invalid catalog row", () => {
    expect(
      TradeCategorySchema.safeParse({
        code: "Carpentry and Woodwork",
        created_at: "2026-07-25T15:00:00.000",
        deleted_at: null,
        id: "20000000-0000-4000-8000-000000000001",
        updated_at: null
      }).success
    ).toBe(false);
  });
});
