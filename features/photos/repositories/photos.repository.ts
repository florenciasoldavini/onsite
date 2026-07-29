import type { UserRole } from "@/features/auth/types/auth.types";
import type {
  CreateProjectPhotoInput,
  ProjectPhoto,
  ProjectPhotoFilters,
  UpdateProjectPhotoInput
} from "@/features/photos/types/photo";
import {
  requireSupabase,
  toRepositoryError
} from "@/infrastructure/supabase/repository";
import {
  getOffsetPageRange,
  toPaginatedResult,
  type OffsetPageRequest
} from "@/shared/utils/pagination";

const PROJECT_PHOTO_COLUMNS = [
  "caption",
  "captured_at",
  "created_at",
  "deleted_at",
  "file_size_bytes",
  "full_path",
  "height",
  "id",
  "is_marketing",
  "kind",
  "latitude",
  "location_accuracy_meters",
  "location_source",
  "longitude",
  "mime_type",
  "owner_id",
  "project_id",
  "thumbnail_path",
  "updated_at",
  "uploaded_by",
  "width"
].join(",");

export async function listProjectPhotoRows({
  filters,
  offset,
  pageSize,
  projectId,
  userId: _userId,
  userRole: _userRole
}: {
  filters?: ProjectPhotoFilters;
  projectId: string;
  userId: string;
  userRole: UserRole;
} & OffsetPageRequest) {
  const client = requireSupabase();
  const range = getOffsetPageRange({ offset, pageSize });
  let query = client
    .from("project_photos")
    .select(PROJECT_PHOTO_COLUMNS)
    .eq("project_id", projectId)
    .is("deleted_at", null);

  if (filters?.kind && filters.kind !== "all") {
    query = query.eq("kind", filters.kind);
  }

  if (filters?.marketing === "marketing") {
    query = query.eq("is_marketing", true);
  }

  const { data, error } = await query
    .order("captured_at", { ascending: false })
    .order("id", { ascending: false })
    .range(range.from, range.to);

  if (error) {
    throw toRepositoryError(error);
  }

  return toPaginatedResult((data ?? []) as unknown as ProjectPhoto[], range);
}

export async function getProjectPhotoRow(photoId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_photos")
    .select(PROJECT_PHOTO_COLUMNS)
    .eq("id", photoId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw toRepositoryError(error);
  }

  return data ? (data as unknown as ProjectPhoto) : null;
}

export async function insertProjectPhotoRow(input: CreateProjectPhotoInput) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_photos")
    .insert(input)
    .select(PROJECT_PHOTO_COLUMNS)
    .single();

  if (error) {
    throw toRepositoryError(error);
  }

  return data as unknown as ProjectPhoto;
}

export async function updateProjectPhotoRow(
  photoId: string,
  input: UpdateProjectPhotoInput
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_photos")
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq("id", photoId)
    .is("deleted_at", null)
    .select(PROJECT_PHOTO_COLUMNS)
    .single();

  if (error) {
    throw toRepositoryError(error);
  }

  return data as unknown as ProjectPhoto;
}

export async function softDeleteProjectPhotoRow(photoId: string) {
  const client = requireSupabase();
  const deletedAt = new Date().toISOString();
  const { error } = await client
    .from("project_photos")
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq("id", photoId)
    .is("deleted_at", null);

  if (error) {
    throw toRepositoryError(error);
  }
}
