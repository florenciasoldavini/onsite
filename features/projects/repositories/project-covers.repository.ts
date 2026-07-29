import { PROJECT_COVER_BUCKET } from "@/features/projects/constants/project.constants";
import {
  requireSupabase,
  toRepositoryError
} from "@/infrastructure/supabase/repository";

const COVER_SIGNED_URL_SECONDS = 5 * 60;

export async function createProjectCoverSignedUrl(path: string) {
  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(PROJECT_COVER_BUCKET)
    .createSignedUrl(path, COVER_SIGNED_URL_SECONDS);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

export async function uploadProjectCoverObject({
  asset,
  projectId
}: {
  asset: { fileName?: string | null; mimeType?: string | null; uri: string };
  projectId: string;
}) {
  const client = requireSupabase();
  const extension = getCoverExtension(asset);
  const path = `projects/${projectId}/cover/${createRandomId()}.${extension}`;
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const { error } = await client.storage
    .from(PROJECT_COVER_BUCKET)
    .upload(path, blob, {
      cacheControl: "3600",
      contentType: asset.mimeType ?? getMimeTypeFromExtension(extension),
      upsert: false
    });

  if (error) {
    throw toRepositoryError(error);
  }

  return path;
}

export async function removeProjectCoverObject({
  path,
  projectId
}: {
  path: string;
  projectId: string;
}) {
  if (!path.startsWith(`projects/${projectId}/cover/`)) {
    throw new Error(
      "Refusing to remove a project cover outside the expected project path."
    );
  }

  const client = requireSupabase();
  const { error } = await client.storage
    .from(PROJECT_COVER_BUCKET)
    .remove([path]);

  if (error) {
    throw toRepositoryError(error);
  }
}

function createRandomId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function getCoverExtension(asset: {
  fileName?: string | null;
  mimeType?: string | null;
}) {
  const fileExtension = asset.fileName?.split(".").pop()?.toLowerCase();

  if (
    fileExtension &&
    ["heic", "heif", "jpeg", "jpg", "png", "webp"].includes(fileExtension)
  ) {
    return fileExtension === "jpeg" ? "jpg" : fileExtension;
  }

  if (asset.mimeType?.includes("png")) {
    return "png";
  }

  if (asset.mimeType?.includes("webp")) {
    return "webp";
  }

  if (asset.mimeType?.includes("heic")) {
    return "heic";
  }

  if (asset.mimeType?.includes("heif")) {
    return "heif";
  }

  return "jpg";
}

function getMimeTypeFromExtension(extension: string) {
  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  if (extension === "heic") {
    return "image/heic";
  }

  if (extension === "heif") {
    return "image/heif";
  }

  return "image/jpeg";
}
