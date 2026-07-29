import { buildProjectListQueryPlan } from "@/features/projects/repositories/project-list-query";

describe("project list query", () => {
  it("relies on RLS for owner and shared-project filtering", () => {
    const plan = buildProjectListQueryPlan({
      filters: { status: "in_progress" },
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.filters).toContainEqual({
      column: "deleted_at",
      operator: "is",
      value: null
    });
    expect(plan.filters).not.toContainEqual(
      expect.objectContaining({ column: "owner_id" })
    );
  });

  it("filters linked projects by client", () => {
    const plan = buildProjectListQueryPlan({
      filters: { clientId: "client-id" },
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.filters).toContainEqual({
      column: "client_id",
      operator: "eq",
      value: "client-id"
    });
  });

  it("does not add owner filtering for admins", () => {
    const plan = buildProjectListQueryPlan({
      filters: { status: "in_progress" },
      userId: "admin-id",
      userRole: "admin"
    });

    expect(plan.filters).not.toContainEqual({
      column: "owner_id",
      operator: "eq",
      value: "admin-id"
    });
  });

  it("plans multi-select category filters", () => {
    const plan = buildProjectListQueryPlan({
      filters: {
        phases: ["design", "construction"],
        projectTypes: ["new_build", "renovation"],
        statuses: ["planned", "in_progress"]
      },
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.filters).toContainEqual({
      column: "status",
      operator: "in",
      value: ["planned", "in_progress"]
    });
    expect(plan.filters).toContainEqual({
      column: "phase",
      operator: "in",
      value: ["design", "construction"]
    });
    expect(plan.filters).toContainEqual({
      column: "project_type",
      operator: "in",
      value: ["new_build", "renovation"]
    });
  });

  it("sorts by newest creation by default", () => {
    const plan = buildProjectListQueryPlan({
      filters: {},
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.orders).toEqual([
      { ascending: false, column: "created_at" },
      { ascending: true, column: "id" }
    ]);
  });

  it("sorts alphabetically ascending when requested", () => {
    const plan = buildProjectListQueryPlan({
      filters: { sort: "name_asc" },
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.orders).toEqual([
      { ascending: true, column: "name" },
      { ascending: true, column: "id" }
    ]);
  });

  it("sorts alphabetically descending when requested", () => {
    const plan = buildProjectListQueryPlan({
      filters: { sort: "name_desc" },
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.orders).toEqual([
      { ascending: false, column: "name" },
      { ascending: true, column: "id" }
    ]);
  });

  it("sorts creation ascending when requested", () => {
    const plan = buildProjectListQueryPlan({
      filters: { sort: "created_asc" },
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.orders).toEqual([
      { ascending: true, column: "created_at" },
      { ascending: true, column: "id" }
    ]);
  });
});
