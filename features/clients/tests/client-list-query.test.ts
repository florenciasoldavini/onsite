import {
  buildClientListQueryPlan,
  buildClientSearchFilter
} from "@/features/clients/repositories/client-list-query";
import { describe, expect, it } from "vitest";

describe("client list query", () => {
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
});
