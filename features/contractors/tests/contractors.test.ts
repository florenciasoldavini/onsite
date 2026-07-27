import {
  buildContractorListQueryPlan,
  buildContractorSearchFilter
} from "@/features/contractors/repositories/contractor-list-query";
import {
  contractorFormSchema,
  getContractorDisplayName,
  getContractorInitials,
  normalizeContractorFilters,
  toContractorInput
} from "@/features/contractors/schemas/contractor.schema";
import { describe, expect, it } from "vitest";

describe("contractor schema helpers", () => {
  it("normalizes contact form values", () => {
    expect(
      toContractorInput({
        email: "  FOREMAN@EXAMPLE.COM ",
        first_name: "  Alex ",
        last_name: " ",
        phone_number: " +54 11 5555 0101 "
      })
    ).toEqual({
      email: "foreman@example.com",
      first_name: "Alex",
      last_name: null,
      phone_number: "+54 11 5555 0101"
    });
  });

  it("validates the required name and optional contact fields", () => {
    expect(
      contractorFormSchema.safeParse({
        email: "",
        first_name: "Alex",
        last_name: "",
        phone_number: ""
      }).success
    ).toBe(true);
    expect(
      contractorFormSchema.safeParse({
        email: "invalid",
        first_name: "",
        last_name: "",
        phone_number: "1"
      }).success
    ).toBe(false);
  });

  it("builds display names and initials", () => {
    expect(
      getContractorDisplayName({ first_name: "Alex", last_name: "Morgan" })
    ).toBe("Alex Morgan");
    expect(
      getContractorInitials({ first_name: "Alex", last_name: "Morgan" })
    ).toBe("AM");
    expect(
      getContractorInitials({ first_name: "Alex", last_name: null })
    ).toBe("AL");
  });

  it("normalizes filters", () => {
    expect(normalizeContractorFilters()).toEqual({
      query: null,
      sort: "created_desc"
    });
    expect(
      normalizeContractorFilters({ query: "  mason ", sort: "name_asc" })
    ).toEqual({ query: "mason", sort: "name_asc" });
  });
});

describe("contractor list query plan", () => {
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
    ).toEqual([
      { column: "deleted_at", operator: "is", value: null }
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
