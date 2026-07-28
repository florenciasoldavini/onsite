import type { UserRole } from "@/features/auth/types/auth.types";
import {
  createProjectPhotoSignedUrl,
  removeProjectPhotoObjects,
  uploadProjectPhotoObjects
} from "@/features/photos/repositories/photo-storage.repository";
import {
  getProjectPhotoRow,
  insertProjectPhotoRow,
  listProjectPhotoRows,
  softDeleteProjectPhotoRow,
  updateProjectPhotoRow
} from "@/features/photos/repositories/photos.repository";
import { normalizeProjectPhotoAsset } from "@/features/photos/services/photo-normalization.service";
import type {
  ProjectPhoto,
  ProjectPhotoDraft,
  ProjectPhotoFilters,
  ProjectPhotoUploadOutcome,
  UpdateProjectPhotoInput
} from "@/features/photos/types/photo";
import { getProject } from "@/features/projects/services/projects.service";
import { Sentry } from "@/infrastructure/monitoring/sentry";
import type {
  OffsetPageRequest,
  PaginatedResult
} from "@/shared/utils/pagination";
import { UserFacingError } from "@/shared/utils/user-facing-errors";

export type ProjectPhotoUploadStage =
  | "failed"
  | "preparing"
  | "retrying"
  | "saved"
  | "uploading";

export async function listProjectPhotos({
  filters,
  offset,
  pageSize,
  projectId,
  userId,
  userRole
}: {
  filters?: ProjectPhotoFilters;
  projectId: string;
  userId: string;
  userRole: UserRole;
} & OffsetPageRequest): Promise<PaginatedResult<ProjectPhoto>> {
  const page = await listProjectPhotoRows({
    filters,
    offset,
    pageSize,
    projectId,
    userId,
    userRole
  });

  return {
    ...page,
    items: await Promise.all(
      page.items.map(async (photo) => ({
        ...photo,
        thumbnail_url: await createProjectPhotoSignedUrl(photo.thumbnail_path)
      }))
    )
  };
}

export async function getProjectPhoto(photoId: string) {
  const photo = await getProjectPhotoRow(photoId);

  if (!photo) {
    return null;
  }

  const [fullUrl, thumbnailUrl] = await Promise.all([
    createProjectPhotoSignedUrl(photo.full_path),
    createProjectPhotoSignedUrl(photo.thumbnail_path)
  ]);

  return {
    ...photo,
    full_url: fullUrl,
    thumbnail_url: thumbnailUrl
  };
}

export async function uploadProjectPhotoBatch({
  drafts,
  onStageChange,
  projectId
}: {
  drafts: ProjectPhotoDraft[];
  onStageChange?: (photoId: string, stage: ProjectPhotoUploadStage) => void;
  projectId: string;
}) {
  const project = await getProject(projectId);

  if (!project) {
    throw new UserFacingError(
      "This project could not be found. Return to projects and try again."
    );
  }

  const outcomes: ProjectPhotoUploadOutcome[] = new Array(drafts.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < drafts.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const draft = drafts[currentIndex];

      outcomes[currentIndex] = await uploadOneProjectPhoto({
        draft,
        onStageChange,
        projectId
      });
    }
  }

  await Promise.all([
    worker(),
    worker()
  ]);

  return outcomes;
}

export async function updateProjectPhoto(
  photoId: string,
  input: UpdateProjectPhotoInput
) {
  return updateProjectPhotoRow(photoId, input);
}

export async function softDeleteProjectPhoto(photoId: string) {
  const photo = await getProjectPhotoRow(photoId);

  if (!photo) {
    throw new UserFacingError(
      "This photo could not be found. Return to the gallery and try again."
    );
  }

  await softDeleteProjectPhotoRow(photoId);

  try {
    await removeProjectPhotoObjects([
      photo.full_path,
      photo.thumbnail_path
    ]);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { storage_cleanup: "project-photo-soft-delete" }
    });
  }
}

async function uploadOneProjectPhoto({
  draft,
  onStageChange,
  projectId
}: {
  draft: ProjectPhotoDraft;
  onStageChange?: (photoId: string, stage: ProjectPhotoUploadStage) => void;
  projectId: string;
}): Promise<ProjectPhotoUploadOutcome> {
  try {
    const existing = await getProjectPhotoRow(draft.id);

    if (existing) {
      if (existing.project_id !== projectId) {
        throw new UserFacingError(
          "This photo upload belongs to another project. Remove it and try again."
        );
      }

      onStageChange?.(draft.id, "saved");
      return {
        error: null,
        photo: existing,
        photoId: draft.id,
        status: "saved"
      };
    }

    onStageChange?.(draft.id, "preparing");
    const normalized = await normalizeProjectPhotoAsset(draft.asset);
    onStageChange?.(draft.id, "uploading");
    const paths = await uploadProjectPhotoObjects({
      fullUri: normalized.fullUri,
      photoId: draft.id,
      projectId,
      thumbnailUri: normalized.thumbnailUri
    });

    try {
      const photo = await insertProjectPhotoRow({
        caption: draft.caption.trim() || null,
        captured_at: normalized.capturedAt,
        file_size_bytes: normalized.fileSizeBytes,
        full_path: paths.fullPath,
        height: normalized.height,
        id: draft.id,
        is_marketing: draft.is_marketing,
        kind: draft.kind,
        latitude: normalized.latitude,
        location_accuracy_meters: normalized.locationAccuracyMeters,
        location_source: normalized.locationSource,
        longitude: normalized.longitude,
        mime_type: "image/jpeg",
        project_id: projectId,
        thumbnail_path: paths.thumbnailPath,
        width: normalized.width
      });

      onStageChange?.(draft.id, "saved");
      return {
        error: null,
        photo,
        photoId: draft.id,
        status: "saved"
      };
    } catch (error) {
      await removeProjectPhotoObjects([
        paths.fullPath,
        paths.thumbnailPath
      ]).catch((cleanupError) => {
        Sentry.captureException(cleanupError, {
          tags: { storage_cleanup: "project-photo-compensation" }
        });
      });
      throw error;
    }
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error("Photo upload failed.");
    onStageChange?.(draft.id, "failed");

    return {
      error: normalizedError,
      photo: null,
      photoId: draft.id,
      status: "failed"
    };
  }
}
