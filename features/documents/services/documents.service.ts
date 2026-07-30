import {
  createProjectDocumentSignedUrl,
  removeProjectDocumentObject,
  uploadProjectDocumentObject
} from "@/features/documents/repositories/document-storage.repository";
import {
  getProjectDocumentRow,
  insertProjectDocumentRow,
  listProjectDocumentRows,
  softDeleteProjectDocumentRow,
  updateProjectDocumentRow
} from "@/features/documents/repositories/documents.repository";
import {
  cancelPreparedDocumentOpen,
  downloadDocumentUrl,
  openDocumentUrl,
  prepareDocumentOpen
} from "@/features/documents/services/document-access";
import type {
  DocumentAccessMode,
  DocumentListFilters,
  DocumentPickerAsset,
  DocumentUploadStage,
  ProjectDocument,
  UpdateProjectDocumentInput
} from "@/features/documents/types/document";
import {
  getProjectDocumentPath,
  prepareDocumentFile,
  sanitizeDownloadFilename
} from "@/features/documents/utils/document-file";
import { Sentry } from "@/infrastructure/monitoring/sentry";
import type { OffsetPageRequest } from "@/shared/utils/pagination";
import { UserFacingError } from "@/shared/utils/user-facing-errors";
import * as Crypto from "expo-crypto";

export function listProjectDocuments({
  filters,
  offset,
  pageSize,
  projectId
}: {
  filters?: DocumentListFilters;
  projectId: string;
} & OffsetPageRequest) {
  return listProjectDocumentRows({
    filters,
    offset,
    pageSize,
    projectId
  });
}

export async function uploadProjectDocument({
  asset,
  category,
  name,
  onStageChange,
  projectId
}: {
  asset: DocumentPickerAsset;
  category: ProjectDocument["category"];
  name: string;
  onStageChange?: (stage: DocumentUploadStage) => void;
  projectId: string;
}) {
  onStageChange?.("validating");
  const prepared = await prepareDocumentFile(asset);
  const documentId = Crypto.randomUUID();
  const objectPath = getProjectDocumentPath({
    documentId,
    extension: prepared.extension,
    projectId
  });

  onStageChange?.("uploading");
  await uploadProjectDocumentObject({
    bytes: prepared.bytes,
    mimeType: prepared.mimeType,
    path: objectPath
  });

  try {
    onStageChange?.("saving");
    const document = await insertProjectDocumentRow({
      category,
      file_extension: prepared.extension,
      file_size_bytes: prepared.size,
      id: documentId,
      mime_type: prepared.mimeType,
      name: name.trim(),
      object_path: objectPath,
      original_filename: prepared.originalFilename,
      project_id: projectId
    });
    onStageChange?.("saved");
    return { document, status: "saved" } as const;
  } catch (error) {
    await removeProjectDocumentObject(objectPath).catch((cleanupError) => {
      Sentry.captureException(cleanupError, {
        tags: { storage_cleanup: "project-document-compensation" }
      });
    });
    onStageChange?.("failed");
    throw error;
  }
}

export function updateProjectDocument(
  documentId: string,
  input: UpdateProjectDocumentInput
) {
  return updateProjectDocumentRow(documentId, input);
}

export async function softDeleteProjectDocument(documentId: string) {
  const document = await getProjectDocumentRow(documentId);
  if (!document) {
    throw new UserFacingError(
      "This document could not be found. Refresh the document list and try again."
    );
  }

  await softDeleteProjectDocumentRow(documentId);
  try {
    await removeProjectDocumentObject(document.object_path);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { storage_cleanup: "project-document-soft-delete" }
    });
  }
}

export async function accessProjectDocument({
  document,
  mode
}: {
  document: ProjectDocument;
  mode: DocumentAccessMode;
}) {
  const preparedOpen = mode === "open" ? prepareDocumentOpen() : null;
  const filename = sanitizeDownloadFilename(
    document.original_filename,
    document.file_extension
  );
  let url: string;
  try {
    url = await createProjectDocumentSignedUrl({
      extension: document.file_extension,
      filename,
      mode,
      path: document.object_path
    });
  } catch (error) {
    cancelPreparedDocumentOpen(preparedOpen);
    throw error;
  }

  if (mode === "open") {
    await openDocumentUrl(url, preparedOpen);
  } else {
    await downloadDocumentUrl({
      filename,
      mimeType: document.mime_type,
      url
    });
  }
}
