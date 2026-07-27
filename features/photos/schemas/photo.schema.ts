import { PROJECT_PHOTO_KINDS } from "@/features/photos/constants/photo.constants";
import type {
  ProjectPhoto,
  ProjectPhotoAsset,
  ProjectPhotoDraft,
  ProjectPhotoFilters,
  UpdateProjectPhotoInput
} from "@/features/photos/types/photo";
import { z } from "zod";

const projectPhotoKindSchema = z.enum(PROJECT_PHOTO_KINDS);
const isoTimestampSchema = z.string().datetime({ offset: true });
const nullableIsoTimestampSchema = isoTimestampSchema.nullable();

export const ProjectPhotoSchema: z.ZodType<ProjectPhoto> = z.object({
  caption: z.string().nullable(),
  captured_at: isoTimestampSchema,
  created_at: isoTimestampSchema,
  deleted_at: nullableIsoTimestampSchema,
  file_size_bytes: z.number().int().positive(),
  full_path: z.string(),
  full_url: z.string().nullable().optional(),
  height: z.number().int().positive(),
  id: z.string().uuid(),
  is_marketing: z.boolean(),
  kind: projectPhotoKindSchema,
  latitude: z.number().min(-90).max(90).nullable(),
  location_accuracy_meters: z.number().positive().nullable(),
  location_source: z.literal("photo_exif").nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  mime_type: z.literal("image/jpeg"),
  owner_id: z.string().uuid(),
  project_id: z.string().uuid(),
  thumbnail_path: z.string(),
  thumbnail_url: z.string().nullable().optional(),
  updated_at: nullableIsoTimestampSchema,
  uploaded_by: z.string().uuid(),
  width: z.number().int().positive()
});

export const projectPhotoDraftSchema: z.ZodType<ProjectPhotoDraft> = z.object({
  asset: z.custom<ProjectPhotoAsset>(
    (value) =>
      Boolean(
        value &&
          typeof value === "object" &&
          "uri" in value &&
          "width" in value &&
          "height" in value
      ),
    "Choose a valid photo."
  ),
  caption: z
    .string()
    .trim()
    .max(1000, "Caption must be 1,000 characters or fewer."),
  id: z.string().uuid(),
  is_marketing: z.boolean(),
  kind: projectPhotoKindSchema
});

export const projectPhotoBatchFormSchema = z.object({
  photos: z
    .array(projectPhotoDraftSchema)
    .min(1, "Add at least one photo.")
    .max(20, "You can upload up to 20 photos at once.")
});

export const projectPhotoEditSchema = z.object({
  caption: z
    .string()
    .trim()
    .max(1000, "Caption must be 1,000 characters or fewer."),
  is_marketing: z.boolean(),
  kind: projectPhotoKindSchema
});

export function toProjectPhotoUpdateInput(
  values: z.infer<typeof projectPhotoEditSchema>
): UpdateProjectPhotoInput {
  const caption = values.caption.trim();

  return {
    caption: caption || null,
    is_marketing: values.is_marketing,
    kind: values.kind
  };
}

export function normalizeProjectPhotoFilters(
  filters: ProjectPhotoFilters = {}
) {
  return {
    kind: PROJECT_PHOTO_KINDS.includes(
      filters.kind as (typeof PROJECT_PHOTO_KINDS)[number]
    )
      ? filters.kind
      : "all",
    marketing: filters.marketing === "marketing" ? "marketing" : "all"
  } as const;
}
