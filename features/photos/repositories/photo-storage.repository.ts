import { PROJECT_PHOTO_BUCKET } from "@/features/photos/constants/photo.constants";
import {
  requireSupabase,
  toRepositoryError
} from "@/infrastructure/supabase/repository";

const PHOTO_SIGNED_URL_SECONDS = 5 * 60;

export function getProjectPhotoPaths({
  photoId,
  projectId
}: {
  photoId: string;
  projectId: string;
}) {
  const basePath = `projects/${projectId}/photos/${photoId}`;

  return {
    fullPath: `${basePath}/full.jpg`,
    thumbnailPath: `${basePath}/thumbnail.jpg`
  };
}
export async function createProjectPhotoSignedUrl(path: string) {
  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(PROJECT_PHOTO_BUCKET)
    .createSignedUrl(path, PHOTO_SIGNED_URL_SECONDS);

  return error ? null : data.signedUrl;
}

export async function uploadProjectPhotoObjects({
  fullUri,
  photoId,
  projectId,
  thumbnailUri
}: {
  fullUri: string;
  photoId: string;
  projectId: string;
  thumbnailUri: string;
}) {
  const paths = getProjectPhotoPaths({ photoId, projectId });
  const uploadedPaths: string[] = [];

  try {
    await uploadJpegObject(paths.fullPath, fullUri);
    uploadedPaths.push(paths.fullPath);
    await uploadJpegObject(paths.thumbnailPath, thumbnailUri);
    uploadedPaths.push(paths.thumbnailPath);
    return paths;
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await removeProjectPhotoObjects(uploadedPaths).catch(() => undefined);
    }

    throw error;
  }
}

export async function removeProjectPhotoObjects(paths: string[]) {
  if (
    paths.length === 0 ||
    paths.some(
      (path) =>
        !/^projects\/[0-9a-f-]+\/photos\/[0-9a-f-]+\/(full|thumbnail)\.jpg$/i.test(
          path
        )
    )
  ) {
    throw new Error(
      "Refusing to remove project photos outside the expected paths."
    );
  }

  const client = requireSupabase();
  const { error } = await client.storage
    .from(PROJECT_PHOTO_BUCKET)
    .remove(paths);

  if (error) {
    throw toRepositoryError(error);
  }
}

async function uploadJpegObject(path: string, uri: string) {
  const client = requireSupabase();
  const blob = await (await fetch(uri)).blob();
  const { error } = await client.storage
    .from(PROJECT_PHOTO_BUCKET)
    .upload(path, blob, {
      cacheControl: "31536000",
      contentType: "image/jpeg",
      upsert: false
    });

  if (error) {
    throw toRepositoryError(error);
  }
}
