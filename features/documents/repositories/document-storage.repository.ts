import { PROJECT_DOCUMENT_BUCKET } from "@/features/documents/constants/document.constants";
import type {
  DocumentAccessMode,
  DocumentMimeType
} from "@/features/documents/types/document";
import { sanitizeDownloadFilename } from "@/features/documents/utils/document-file";
import {
  requireSupabase,
  toRepositoryError
} from "@/infrastructure/supabase/repository";

const DOCUMENT_SIGNED_URL_SECONDS = 5 * 60;

export async function uploadProjectDocumentObject({
  bytes,
  mimeType,
  path
}: {
  bytes: ArrayBuffer;
  mimeType: DocumentMimeType;
  path: string;
}) {
  const client = requireSupabase();
  const { error } = await client.storage
    .from(PROJECT_DOCUMENT_BUCKET)
    .upload(path, bytes, {
      cacheControl: "31536000",
      contentType: mimeType,
      upsert: false
    });

  if (error) throw toRepositoryError(error);
}

export async function removeProjectDocumentObject(path: string) {
  if (
    !/^projects\/[0-9a-f-]+\/documents\/[0-9a-f-]+\/file\.(pdf|jpg|png)$/i.test(
      path
    )
  ) {
    throw new Error(
      "Refusing to remove a project document outside the expected path."
    );
  }

  const client = requireSupabase();
  const { error } = await client.storage
    .from(PROJECT_DOCUMENT_BUCKET)
    .remove([path]);
  if (error) throw toRepositoryError(error);
}

export async function createProjectDocumentSignedUrl({
  extension,
  filename,
  mode,
  path
}: {
  extension: "jpg" | "pdf" | "png";
  filename: string;
  mode: DocumentAccessMode;
  path: string;
}) {
  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(PROJECT_DOCUMENT_BUCKET)
    .createSignedUrl(path, DOCUMENT_SIGNED_URL_SECONDS, {
      download:
        mode === "download"
          ? sanitizeDownloadFilename(filename, extension)
          : false
    });

  if (error) throw toRepositoryError(error);
  return data.signedUrl;
}
