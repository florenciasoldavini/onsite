import {
  createProjectWithOptionalCover,
  updateProjectWithOptionalCover,
  uploadProjectCover
} from "@/features/projects/services/projects.service";

const mocks = {
  captureException: jest.fn(),
  getProjectRow: jest.fn(),
  insertProjectRow: jest.fn(),
  removeProjectCoverObject: jest.fn(),
  replaceProjectCoverPath: jest.fn(),
  updateProjectRow: jest.fn(),
  uploadProjectCoverObject: jest.fn()
};

jest.mock("@/features/projects/repositories/project-covers.repository", () => ({
  createProjectCoverSignedUrl: jest.fn(),
  get removeProjectCoverObject() {
    return mocks.removeProjectCoverObject;
  },
  get uploadProjectCoverObject() {
    return mocks.uploadProjectCoverObject;
  }
}));

jest.mock("@/features/projects/repositories/projects.repository", () => ({
  get getProjectRow() {
    return mocks.getProjectRow;
  },
  get insertProjectRow() {
    return mocks.insertProjectRow;
  },
  listProjectRows: jest.fn(),
  get replaceProjectCoverPath() {
    return mocks.replaceProjectCoverPath;
  },
  softDeleteProjectRow: jest.fn(),
  get updateProjectRow() {
    return mocks.updateProjectRow;
  }
}));

jest.mock("@/infrastructure/monitoring/sentry", () => ({
  Sentry: {
    get captureException() {
      return mocks.captureException;
    }
  }
}));

const asset = { uri: "file:///cover.jpg" };
const createInput = {
  address: "Main Street 1",
  building_type: "residential" as const,
  client_id: null,
  description: null,
  end_date: null,
  estimated_end_date: "2026-08-01",
  estimated_start_date: null,
  google_place_id: "place-id",
  latitude: -34.6,
  longitude: -58.4,
  name: "Project name",
  phase: "concept" as const,
  progress_percentage: 0,
  project_type: "new_build" as const,
  start_date: null,
  status: "planned" as const
};
const project = {
  address: "Main Street 1",
  building_type: "residential" as const,
  client_id: null,
  cover_image_path: null,
  created_at: "2026-07-21T12:00:00.000Z",
  deleted_at: null,
  description: null,
  end_date: null,
  estimated_end_date: "2026-08-01",
  estimated_start_date: null,
  google_place_id: "place-id",
  id: "project-id",
  latitude: -34.6,
  longitude: -58.4,
  name: "Project name",
  owner_id: "user-id",
  phase: "concept" as const,
  progress_percentage: 0,
  project_type: "new_build" as const,
  start_date: null,
  status: "planned" as const,
  updated_at: null
};

describe("project cover replacement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.getProjectRow.mockResolvedValue({
      cover_image_path: "projects/project-id/cover/old.jpg",
      id: "project-id"
    });
    mocks.uploadProjectCoverObject.mockResolvedValue(
      "projects/project-id/cover/new.jpg"
    );
    mocks.replaceProjectCoverPath.mockResolvedValue({ id: "project-id" });
  });

  it("removes the new cover when the database reference switch fails", async () => {
    mocks.replaceProjectCoverPath.mockRejectedValue(
      new Error("concurrent update")
    );

    await expect(
      uploadProjectCover({ asset, projectId: "project-id" })
    ).rejects.toThrow("concurrent update");
    expect(mocks.removeProjectCoverObject).toHaveBeenCalledWith({
      path: "projects/project-id/cover/new.jpg",
      projectId: "project-id"
    });
  });

  it("conditionally switches the reference before deleting the old cover", async () => {
    await uploadProjectCover({ asset, projectId: "project-id" });

    expect(mocks.replaceProjectCoverPath).toHaveBeenCalledWith({
      expectedCurrentPath: "projects/project-id/cover/old.jpg",
      newPath: "projects/project-id/cover/new.jpg",
      projectId: "project-id"
    });
    expect(mocks.removeProjectCoverObject).toHaveBeenCalledWith({
      path: "projects/project-id/cover/old.jpg",
      projectId: "project-id"
    });
  });

  it("keeps the new reference when old-object cleanup fails", async () => {
    mocks.removeProjectCoverObject.mockRejectedValue(
      new Error("cleanup failed")
    );

    await expect(
      uploadProjectCover({ asset, projectId: "project-id" })
    ).resolves.toBe("projects/project-id/cover/new.jpg");
    expect(mocks.captureException).toHaveBeenCalledTimes(1);
  });

  it("does not upload when the project is unavailable", async () => {
    mocks.getProjectRow.mockResolvedValue(null);

    await expect(
      uploadProjectCover({ asset, projectId: "missing" })
    ).rejects.toThrow(
      "This project could not be found. Return to projects and try again."
    );
    expect(mocks.uploadProjectCoverObject).not.toHaveBeenCalled();
  });
});

describe("project save with an optional cover", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.insertProjectRow.mockResolvedValue(project);
    mocks.updateProjectRow.mockResolvedValue(project);
    mocks.getProjectRow.mockResolvedValue(project);
    mocks.uploadProjectCoverObject.mockRejectedValue(
      new Error("storage unavailable")
    );
  });

  it("reports partial success when a new project is saved but its cover fails", async () => {
    await expect(
      createProjectWithOptionalCover({ coverAsset: asset, input: createInput })
    ).resolves.toEqual({ coverStatus: "failed", project });

    expect(mocks.insertProjectRow).toHaveBeenCalledTimes(1);
    expect(mocks.captureException).toHaveBeenCalledTimes(1);
  });

  it("reports partial success when an edited project is saved but its cover fails", async () => {
    await expect(
      updateProjectWithOptionalCover({
        coverAsset: asset,
        input: {},
        projectId: project.id
      })
    ).resolves.toEqual({ coverStatus: "failed", project });

    expect(mocks.updateProjectRow).toHaveBeenCalledTimes(1);
    expect(mocks.captureException).toHaveBeenCalledTimes(1);
  });

  it("still rejects when the project record itself cannot be created", async () => {
    mocks.insertProjectRow.mockRejectedValue(new Error("database unavailable"));

    await expect(
      createProjectWithOptionalCover({ coverAsset: asset, input: createInput })
    ).rejects.toThrow("database unavailable");
    expect(mocks.uploadProjectCoverObject).not.toHaveBeenCalled();
  });
});
