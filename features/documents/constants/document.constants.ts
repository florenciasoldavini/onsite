export const PROJECT_DOCUMENT_BUCKET = "project-documents";
export const PROJECT_DOCUMENT_PAGE_SIZE = 25;
export const PROJECT_DOCUMENT_MAX_BYTES = 25 * 1024 * 1024;

export const PROJECT_DOCUMENT_CATEGORIES = [
  "drawing",
  "specification",
  "permit",
  "contract",
  "manual",
  "report",
  "invoice",
  "other"
] as const;

export const PROJECT_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png"
] as const;
