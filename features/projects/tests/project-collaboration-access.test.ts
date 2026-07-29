import {
  canAccessProject,
  parseProjectAccess,
  parseRoleOptions
} from "@/features/projects/schemas/project-participant.schema";

describe("project collaboration access", () => {
  it("maps the database access result and checks capability codes", () => {
    const access = parseProjectAccess({
      is_admin: false,
      is_owner: false,
      permissions: ["project.read", "project.photos.write"],
      project_id: "10000000-0000-4000-8000-000000000001",
      role: "site_photographer"
    });

    expect(access).toEqual({
      isAdmin: false,
      isOwner: false,
      permissions: ["project.read", "project.photos.write"],
      projectId: "10000000-0000-4000-8000-000000000001",
      role: "site_photographer"
    });
    expect(canAccessProject(access, "project.photos.write")).toBe(true);
    expect(canAccessProject(access, "project.members.manage")).toBe(false);
    expect(canAccessProject(null, "project.read")).toBe(false);
  });

  it("accepts new validated role codes without a TypeScript enum change", () => {
    expect(
      parseRoleOptions([
        {
          code: "site_photographer",
          description: "Documents progress.",
          display_name: "Site photographer",
          sort_order: 40
        }
      ])
    ).toEqual([
      {
        code: "site_photographer",
        description: "Documents progress.",
        displayName: "Site photographer",
        sortOrder: 40
      }
    ]);
  });

  it("rejects capability codes the application does not know how to consume", () => {
    expect(() =>
      parseProjectAccess({
        is_admin: false,
        is_owner: false,
        permissions: ["project.read", "project.unknown"],
        project_id: "10000000-0000-4000-8000-000000000001",
        role: "viewer"
      })
    ).toThrow();
  });
});
