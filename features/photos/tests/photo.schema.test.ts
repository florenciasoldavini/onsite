import {
  normalizeProjectPhotoFilters,
  projectPhotoBatchFormSchema,
  projectPhotoEditSchema,
  ProjectPhotoSchema,
  toProjectPhotoUpdateInput
} from "@/features/photos/schemas/photo.schema";

const photoId = "10000000-0000-4000-8000-000000000001";
const projectId = "20000000-0000-4000-8000-000000000001";
const userId = "30000000-0000-4000-8000-000000000001";

describe("project photo schema", () => {
  it("accepts a photo whose marketing flag is independent of its category", () => {
    const result = ProjectPhotoSchema.safeParse({
      caption: null,
      captured_at: "2026-07-27T18:00:00.000Z",
      created_at: "2026-07-27T18:01:00.000Z",
      deleted_at: null,
      file_size_bytes: 250_000,
      full_path: `projects/${projectId}/photos/${photoId}/full.jpg`,
      height: 1800,
      id: photoId,
      is_marketing: true,
      kind: "issue",
      latitude: -34.6037,
      location_accuracy_meters: 8,
      location_source: "photo_exif",
      longitude: -58.3816,
      mime_type: "image/jpeg",
      owner_id: userId,
      project_id: projectId,
      thumbnail_path: `projects/${projectId}/photos/${photoId}/thumbnail.jpg`,
      updated_at: null,
      uploaded_by: userId,
      width: 2400
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      is_marketing: true,
      kind: "issue"
    });
  });

  it("rejects invalid UUIDs, categories, and location values", () => {
    const result = ProjectPhotoSchema.safeParse({
      id: "not-a-uuid",
      kind: "marketing",
      latitude: 200
    });

    expect(result.success).toBe(false);
  });

  it("limits batches to 20 and captions to 1,000 characters", () => {
    const draft = {
      asset: { height: 100, uri: "file:///photo.jpg", width: 100 },
      caption: "",
      id: photoId,
      is_marketing: false,
      kind: "general" as const
    };

    expect(
      projectPhotoBatchFormSchema.safeParse({
        photos: Array.from({ length: 21 }, () => draft)
      }).success
    ).toBe(false);
    expect(
      projectPhotoEditSchema.safeParse({
        caption: "a".repeat(1001),
        is_marketing: false,
        kind: "general"
      }).success
    ).toBe(false);
  });

  it("normalizes empty captions and independent filters", () => {
    expect(
      toProjectPhotoUpdateInput({
        caption: "   ",
        is_marketing: true,
        kind: "progress"
      })
    ).toEqual({
      caption: null,
      is_marketing: true,
      kind: "progress"
    });
    expect(
      normalizeProjectPhotoFilters({
        kind: "quality",
        marketing: "marketing"
      })
    ).toEqual({ kind: "quality", marketing: "marketing" });
  });
});
