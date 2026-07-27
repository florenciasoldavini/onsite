import {
  buildClientListQueryPlan,
  buildClientSearchFilter
} from "@/features/clients/repositories/client-list-query";
import {
  clientFormSchema,
  getClientDisplayName,
  getClientInitials,
  normalizeClientFilters,
  toClientInput
} from "@/features/clients/schemas/client.schema";
import { describe, expect, it } from "vitest";

describe("client validation and normalization", () => {
  it("normalizes optional contact fields", () => {
    const values = {
      email: "  ADA@EXAMPLE.COM ",
      first_name: " Ada ",
      last_name: " Lovelace ",
      phone_number: " +54 11 5555 0101 "
    };

    expect(clientFormSchema.safeParse(values).success).toBe(true);
    expect(toClientInput(values)).toEqual({
      email: "ada@example.com",
      first_name: "Ada",
      last_name: "Lovelace",
      phone_number: "+54 11 5555 0101"
    });
  });

  it("converts empty optional values to null", () => {
    expect(
      toClientInput({
        email: " ",
        first_name: "Ada",
        last_name: "",
        phone_number: ""
      })
    ).toEqual({
      email: null,
      first_name: "Ada",
      last_name: null,
      phone_number: null
    });
  });

  it("rejects missing names and malformed email addresses", () => {
    const result = clientFormSchema.safeParse({
      email: "not-an-email",
      first_name: " ",
      last_name: "",
      phone_number: ""
    });

    expect(result.success).toBe(false);
  });

  it("builds a display name without a trailing space", () => {
    expect(getClientDisplayName({ first_name: "Ada", last_name: null })).toBe(
      "Ada"
    );
  });

  it("builds initials from both names or the first name", () => {
    expect(
      getClientInitials({ first_name: "Ada", last_name: "Lovelace" })
    ).toBe("AL");
    expect(
      getClientInitials({ first_name: "Ada", last_name: null })
    ).toBe("AD");
  });
});

describe("client list query planning", () => {
  it("scopes normal users to their own clients", () => {
    const plan = buildClientListQueryPlan({
      filters: { ownerId: "other-user" },
      userId: "current-user",
      userRole: "user"
    });

    expect(plan.filters).toContainEqual({
      column: "owner_id",
      operator: "eq",
      value: "current-user"
    });
  });

  it("lets admins explicitly scope a project picker by owner", () => {
    const plan = buildClientListQueryPlan({
      filters: { ownerId: "project-owner" },
      userId: "admin-user",
      userRole: "admin"
    });

    expect(plan.filters).toContainEqual({
      column: "owner_id",
      operator: "eq",
      value: "project-owner"
    });
  });

  it("uses deterministic alphabetical ordering", () => {
    const plan = buildClientListQueryPlan({
      filters: { sort: "name_desc" },
      userId: "current-user",
      userRole: "user"
    });

    expect(plan.orders).toEqual([
      { ascending: false, column: "first_name" },
      { ascending: false, column: "last_name" },
      { ascending: true, column: "id" }
    ]);
  });

  it("searches every contact field and escapes quotes", () => {
    expect(buildClientSearchFilter('Ada "A"')).toContain(
      'first_name.ilike."%Ada \\"A\\"%"'
    );
    expect(buildClientSearchFilter("Ada")).toContain("email.ilike.");
  });

  it("normalizes the default list state", () => {
    expect(normalizeClientFilters({ query: " " })).toEqual({
      ownerId: null,
      query: null,
      sort: "created_desc"
    });
  });
});
