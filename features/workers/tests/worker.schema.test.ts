import {
  getWorkerDisplayName,
  getWorkerInitials,
  normalizeWorkerFilters,
  toWorkerInput,
  workerFormSchema
} from "@/features/workers/schemas/worker.schema";

describe("worker schema", () => {
  it("normalizes contact and relationship form values", () => {
    expect(
      toWorkerInput({
        contractor_id: "contractor-1",
        email: "  WORKER@EXAMPLE.COM ",
        first_name: "  Alex ",
        last_name: " ",
        phone_number: " +54 11 5555 0101 ",
        trade_category_ids: ["trade-2", "trade-1", "trade-2"]
      })
    ).toEqual({
      contractor_id: "contractor-1",
      email: "worker@example.com",
      first_name: "Alex",
      last_name: null,
      phone_number: "+54 11 5555 0101",
      trade_category_ids: ["trade-1", "trade-2"]
    });
  });

  it("validates required name and optional contact fields", () => {
    expect(
      workerFormSchema.safeParse({
        contractor_id: null,
        email: "",
        first_name: "Alex",
        last_name: "",
        phone_number: "",
        trade_category_ids: []
      }).success
    ).toBe(true);
    expect(
      workerFormSchema.safeParse({
        contractor_id: null,
        email: "invalid",
        first_name: "",
        last_name: "",
        phone_number: "1",
        trade_category_ids: []
      }).success
    ).toBe(false);
  });

  it("builds display names and initials", () => {
    expect(
      getWorkerDisplayName({ first_name: "Alex", last_name: "Morgan" })
    ).toBe("Alex Morgan");
    expect(getWorkerInitials({ first_name: "Alex", last_name: "Morgan" })).toBe(
      "AM"
    );
    expect(getWorkerInitials({ first_name: "Alex", last_name: null })).toBe(
      "AL"
    );
  });

  it("normalizes filters and deduplicates trade categories", () => {
    expect(normalizeWorkerFilters()).toEqual({
      contractorId: null,
      query: null,
      sort: "created_desc",
      tradeCategoryIds: []
    });
    expect(
      normalizeWorkerFilters({
        contractorId: " contractor-1 ",
        query: " mason ",
        sort: "name_asc",
        tradeCategoryIds: ["trade-2", "trade-1", "trade-2"]
      })
    ).toEqual({
      contractorId: "contractor-1",
      query: "mason",
      sort: "name_asc",
      tradeCategoryIds: ["trade-1", "trade-2"]
    });
  });
});
