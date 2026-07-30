import type {
  PROJECT_DOCUMENT_CATEGORIES,
  PROJECT_DOCUMENT_MIME_TYPES
} from "@/features/documents/constants/document.constants";

export type DocumentCategory =
  (typeof PROJECT_DOCUMENT_CATEGORIES)[number];
export type DocumentMimeType =
  (typeof PROJECT_DOCUMENT_MIME_TYPES)[number];
export type DocumentFileExtension = "jpg" | "pdf" | "png";
export type DocumentFileAccessMode = "download" | "open";
export type DocumentAccessMode = DocumentFileAccessMode;

export interface ProjectDocument {
  category: DocumentCategory;
  created_at: string;
  deleted_at: string | null;
  file_extension: DocumentFileExtension;
  file_size_bytes: number;
  id: string;
  mime_type: DocumentMimeType;
  name: string;
  object_path: string;
  original_filename: string;
  project_id: string;
  updated_at: string | null;
  uploaded_by: string;
  uploaded_by_display_name: string;
}

export interface DocumentListFilters {
  category?: DocumentCategory | "all";
  query?: string;
}

export interface DocumentPickerAsset {
  file?: Blob | null;
  mimeType?: string | null;
  name: string;
  size?: number | null;
  uri: string;
}

export interface PreparedDocumentFile {
  bytes: ArrayBuffer;
  extension: DocumentFileExtension;
  mimeType: DocumentMimeType;
  originalFilename: string;
  size: number;
}

export interface DocumentFormValues {
  category: DocumentCategory;
  name: string;
}

export interface CreateDocumentInput {
  category: DocumentCategory;
  file_extension: DocumentFileExtension;
  file_size_bytes: number;
  id: string;
  mime_type: DocumentMimeType;
  name: string;
  object_path: string;
  original_filename: string;
  project_id: string;
}

export interface UpdateDocumentInput {
  category: DocumentCategory;
  name: string;
}

export type CreateProjectDocumentInput = CreateDocumentInput;
export type UpdateProjectDocumentInput = UpdateDocumentInput;

export interface DocumentUploadOutcome {
  document: ProjectDocument;
  status: "saved";
}

export type DocumentDownloadOutcome =
  | { status: "download-started" }
  | { status: "opened" }
  | { status: "shared" };

export type DocumentUploadStage =
  | "cancelled"
  | "failed"
  | "saving"
  | "saved"
  | "uploading"
  | "validating";
