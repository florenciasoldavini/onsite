import type { ProjectSummary } from "@/features/projects/types/project.types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createProjectCoverSignedUrl, listProjectRows } = vi.hoisted(() => ({
  createProjectCoverSignedUrl: vi.fn(),
  listProjectRows: vi.fn()
}));

vi.mock("@/features/projects/repositories/project-covers.repository", () => ({
  createProjectCoverSignedUrl,
  removeProjectCoverObject: vi.fn(),
  uploadProjectCoverObject: vi.fn()
}));

vi.mock("@/features/projects/repositories/projects.repository", () => ({
  getProjectRow: vi.fn(),
  insertProjectRow: vi.fn(),
  listProjectRows,
  replaceProjectCoverPath: vi.fn(),
  softDeleteProjectRow: vi.fn(),
  updateProjectRow: vi.fn()
}));

vi.mock("@/infrastructure/monitoring/sentry", () => ({
  Sentry: { captureException: vi.fn() }
}));

import { listProjects } from "@/features/projects/services/projects.service";

function createSummary(
  overrides: Partial<ProjectSummary> = {}
): ProjectSummary {
  return {
    address: "Main Street 10",
    cover_image_path: null,
    estimated_end_date: null,
    id: "project-1",
    latitude: -34.6,
    longitude: -58.38,
    name: "Main Street Renovation",
    phase: "design",
    progress_percentage: 10,
    project_type: "renovation",
    status: "planned",
    ...overrides
  };
}

describe("paginated project listing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves page metadata while resolving cover URLs", async () => {
    listProjectRows.mockResolvedValue({
      items: [
        createSummary({ cover_image_path: "projects/1/cover/image.jpg" }),
        createSummary({ id: "project-2" })
      ],
      nextOffset: 24
    });
    createProjectCoverSignedUrl.mockResolvedValue("https://signed.example/1");

    const result = await listProjects({
      filters: { status: "planned" },
      offset: 0,
      pageSize: 24,
      userId: "user-1",
      userRole: "user"
    });

    expect(listProjectRows).toHaveBeenCalledWith({
      filters: { status: "planned" },
      offset: 0,
      pageSize: 24,
      userId: "user-1",
      userRole: "user"
    });
    expect(result.nextOffset).toBe(24);
    expect(result.items).toEqual([
      expect.objectContaining({
        cover_image_url: "https://signed.example/1",
        id: "project-1"
      }),
      expect.objectContaining({ cover_image_url: null, id: "project-2" })
    ]);
  });
});
