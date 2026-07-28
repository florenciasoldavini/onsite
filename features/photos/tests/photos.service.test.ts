import type {
  ProjectPhoto,
  ProjectPhotoDraft
} from "@/features/photos/types/photo";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  createSignedUrl: vi.fn(),
  getProject: vi.fn(),
  getRow: vi.fn(),
  insertRow: vi.fn(),
  listRows: vi.fn(),
  normalize: vi.fn(),
  removeObjects: vi.fn(),
  softDeleteRow: vi.fn(),
  updateRow: vi.fn(),
  uploadObjects: vi.fn()
}));

vi.mock("@/features/photos/repositories/photo-storage.repository", () => ({
  createProjectPhotoSignedUrl: mocks.createSignedUrl,
  removeProjectPhotoObjects: mocks.removeObjects,
  uploadProjectPhotoObjects: mocks.uploadObjects
}));

vi.mock("@/features/photos/repositories/photos.repository", () => ({
  getProjectPhotoRow: mocks.getRow,
  insertProjectPhotoRow: mocks.insertRow,
  listProjectPhotoRows: mocks.listRows,
  softDeleteProjectPhotoRow: mocks.softDeleteRow,
  updateProjectPhotoRow: mocks.updateRow
}));

vi.mock("@/features/photos/services/photo-normalization.service", () => ({
  normalizeProjectPhotoAsset: mocks.normalize
}));

vi.mock("@/features/projects/services/projects.service", () => ({
  getProject: mocks.getProject
}));

vi.mock("@/infrastructure/monitoring/sentry", () => ({
  Sentry: { captureException: mocks.captureException }
}));

import {
  listProjectPhotos,
  softDeleteProjectPhoto,
  uploadProjectPhotoBatch
} from "@/features/photos/services/photos.service";

function draft(id: string): ProjectPhotoDraft {
  return {
    asset: {
      height: 1000,
      uri: `file:///${id}.jpg`,
      width: 1200
    },
    caption: "",
    id,
    is_marketing: false,
    kind: "general"
  };
}

function photo(id: string): ProjectPhoto {
  return {
    caption: null,
    captured_at: "2026-07-27T18:00:00.000Z",
    created_at: "2026-07-27T18:01:00.000Z",
    deleted_at: null,
    file_size_bytes: 1000,
    full_path: `projects/project-id/photos/${id}/full.jpg`,
    height: 800,
    id,
    is_marketing: false,
    kind: "general",
    latitude: null,
    location_accuracy_meters: null,
    location_source: null,
    longitude: null,
    mime_type: "image/jpeg",
    owner_id: "owner-id",
    project_id: "project-id",
    thumbnail_path: `projects/project-id/photos/${id}/thumbnail.jpg`,
    updated_at: null,
    uploaded_by: "owner-id",
    width: 1000
  };
}

describe("project photo workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProject.mockResolvedValue({ id: "project-id" });
    mocks.getRow.mockResolvedValue(null);
    mocks.normalize.mockResolvedValue({
      capturedAt: "2026-07-27T18:00:00.000Z",
      fileSizeBytes: 1000,
      fullUri: "file:///full.jpg",
      height: 800,
      latitude: null,
      locationAccuracyMeters: null,
      locationSource: null,
      longitude: null,
      thumbnailUri: "file:///thumbnail.jpg",
      width: 1000
    });
    mocks.uploadObjects.mockImplementation(({ photoId }) =>
      Promise.resolve({
        fullPath: `projects/project-id/photos/${photoId}/full.jpg`,
        thumbnailPath: `projects/project-id/photos/${photoId}/thumbnail.jpg`
      })
    );
    mocks.insertRow.mockImplementation((input) =>
      Promise.resolve(photo(input.id))
    );
    mocks.removeObjects.mockResolvedValue(undefined);
  });

  it("returns per-photo outcomes and retains a partial failure for retry", async () => {
    mocks.normalize.mockImplementation((asset) =>
      asset.uri.includes("failed")
        ? Promise.reject(new Error("corrupt image"))
        : Promise.resolve({
            capturedAt: "2026-07-27T18:00:00.000Z",
            fileSizeBytes: 1000,
            fullUri: "file:///full.jpg",
            height: 800,
            latitude: null,
            locationAccuracyMeters: null,
            locationSource: null,
            longitude: null,
            thumbnailUri: "file:///thumbnail.jpg",
            width: 1000
          })
    );

    const result = await uploadProjectPhotoBatch({
      drafts: [draft("saved"), draft("failed")],
      projectId: "project-id"
    });

    expect(result.map((outcome) => outcome.status)).toEqual([
      "saved",
      "failed"
    ]);
  });

  it("does not process a batch when its project is unavailable", async () => {
    mocks.getProject.mockResolvedValue(null);

    await expect(
      uploadProjectPhotoBatch({
        drafts: [draft("photo-id")],
        projectId: "missing"
      })
    ).rejects.toThrow(
      "This project could not be found. Return to projects and try again."
    );
    expect(mocks.normalize).not.toHaveBeenCalled();
  });

  it("treats an existing matching UUID as completed without uploading", async () => {
    mocks.getRow.mockResolvedValue(photo("retry-id"));

    const result = await uploadProjectPhotoBatch({
      drafts: [draft("retry-id")],
      projectId: "project-id"
    });

    expect(result[0].status).toBe("saved");
    expect(mocks.normalize).not.toHaveBeenCalled();
    expect(mocks.uploadObjects).not.toHaveBeenCalled();
  });

  it("removes uploaded objects when row persistence fails", async () => {
    mocks.insertRow.mockRejectedValue(new Error("database unavailable"));

    const result = await uploadProjectPhotoBatch({
      drafts: [draft("photo-id")],
      projectId: "project-id"
    });

    expect(result[0].status).toBe("failed");
    expect(mocks.removeObjects).toHaveBeenCalledWith([
      "projects/project-id/photos/photo-id/full.jpg",
      "projects/project-id/photos/photo-id/thumbnail.jpg"
    ]);
  });

  it("never processes more than two photos concurrently", async () => {
    let active = 0;
    let peak = 0;
    mocks.normalize.mockImplementation(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return {
        capturedAt: "2026-07-27T18:00:00.000Z",
        fileSizeBytes: 1000,
        fullUri: "file:///full.jpg",
        height: 800,
        latitude: null,
        locationAccuracyMeters: null,
        locationSource: null,
        longitude: null,
        thumbnailUri: "file:///thumbnail.jpg",
        width: 1000
      };
    });

    await uploadProjectPhotoBatch({
      drafts: ["1", "2", "3", "4", "5"].map(draft),
      projectId: "project-id"
    });

    expect(peak).toBe(2);
  });

  it("soft-deletes before cleanup and reports orphan cleanup failures", async () => {
    mocks.getRow.mockResolvedValue(photo("photo-id"));
    mocks.removeObjects.mockRejectedValue(new Error("storage unavailable"));

    await expect(softDeleteProjectPhoto("photo-id")).resolves.toBeUndefined();
    expect(mocks.softDeleteRow).toHaveBeenCalledBefore(mocks.removeObjects);
    expect(mocks.captureException).toHaveBeenCalledOnce();
  });

  it("preserves deterministic page metadata while signing thumbnails", async () => {
    mocks.listRows.mockResolvedValue({
      items: [photo("one")],
      nextOffset: 24
    });
    mocks.createSignedUrl.mockResolvedValue("https://signed.example/thumb");

    const result = await listProjectPhotos({
      filters: { kind: "issue", marketing: "marketing" },
      offset: 0,
      pageSize: 24,
      projectId: "project-id",
      userId: "owner-id",
      userRole: "user"
    });

    expect(result.nextOffset).toBe(24);
    expect(result.items[0].thumbnail_url).toBe("https://signed.example/thumb");
  });

  it("keeps a gallery row usable when its thumbnail URL cannot be signed", async () => {
    mocks.listRows.mockResolvedValue({
      items: [photo("one")],
      nextOffset: null
    });
    mocks.createSignedUrl.mockResolvedValue(null);

    const result = await listProjectPhotos({
      offset: 0,
      pageSize: 24,
      projectId: "project-id",
      userId: "owner-id",
      userRole: "user"
    });

    expect(result.items[0]).toMatchObject({
      id: "one",
      thumbnail_url: null
    });
  });
});
