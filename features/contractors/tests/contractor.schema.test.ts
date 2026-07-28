import {
  contractorFormSchema,
  getContractorDisplayName,
  getContractorInitials,
  normalizeContractorFilters,
  toContractorInput
} from "@/features/contractors/schemas/contractor.schema";

describe("contractor schema", () => {
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
    expect(getContractorInitials({ first_name: "Alex", last_name: null })).toBe(
      "AL"
    );
  });

  it("normalizes filters", () => {
    expect(normalizeContractorFilters()).toEqual({
      ownerId: null,
      query: null,
      sort: "created_desc"
    });
    expect(
      normalizeContractorFilters({
        ownerId: " owner-1 ",
        query: "  mason ",
        sort: "name_asc"
      })
    ).toEqual({
      ownerId: "owner-1",
      query: "mason",
      sort: "name_asc"
    });
  });
});
