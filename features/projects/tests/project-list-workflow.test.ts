import type { ProjectSummary } from "@/features/projects/types/project.types";

const mockCreateProjectCoverSignedUrl = jest.fn();
const mockListProjectRows = jest.fn();

jest.mock("@/features/projects/repositories/project-covers.repository", () => ({
  get createProjectCoverSignedUrl() {
    return mockCreateProjectCoverSignedUrl;
  },
  removeProjectCoverObject: jest.fn(),
  uploadProjectCoverObject: jest.fn()
}));

jest.mock("@/features/projects/repositories/projects.repository", () => ({
  getProjectRow: jest.fn(),
  insertProjectRow: jest.fn(),
  get listProjectRows() {
    return mockListProjectRows;
  },
  replaceProjectCoverPath: jest.fn(),
  softDeleteProjectRow: jest.fn(),
  updateProjectRow: jest.fn()
}));

jest.mock("@/infrastructure/monitoring/sentry", () => ({
  Sentry: { captureException: jest.fn() }
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
    jest.clearAllMocks();
  });

  it("preserves page metadata while resolving cover URLs", async () => {
    mockListProjectRows.mockResolvedValue({
      items: [
        createSummary({ cover_image_path: "projects/1/cover/image.jpg" }),
        createSummary({ id: "project-2" })
      ],
      nextOffset: 24
    });
    mockCreateProjectCoverSignedUrl.mockResolvedValue(
      "https://signed.example/1"
    );

    const result = await listProjects({
      filters: { status: "planned" },
      offset: 0,
      pageSize: 24,
      userId: "user-1",
      userRole: "user"
    });

    expect(mockListProjectRows).toHaveBeenCalledWith({
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
