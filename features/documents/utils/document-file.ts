import { PROJECT_DOCUMENT_MAX_BYTES } from "@/features/documents/constants/document.constants";
import type {
  DocumentFileExtension,
  DocumentMimeType,
  DocumentPickerAsset,
  PreparedDocumentFile
} from "@/features/documents/types/document";
import { readDocumentBytes } from "@/features/documents/utils/document-file-reader";

export type DocumentFileErrorCode =
  | "empty"
  | "invalid-signature"
  | "missing-metadata"
  | "too-large"
  | "unsupported-type";

export class DocumentFileError extends Error {
  constructor(public readonly code: DocumentFileErrorCode) {
    super(code);
    this.name = "DocumentFileError";
  }
}

const metadataByExtension: Record<
  DocumentFileExtension,
  { aliases: string[]; mimeType: DocumentMimeType }
> = {
  jpg: { aliases: ["jpg", "jpeg"], mimeType: "image/jpeg" },
  pdf: { aliases: ["pdf"], mimeType: "application/pdf" },
  png: { aliases: ["png"], mimeType: "image/png" }
};

export async function prepareDocumentFile(
  asset: DocumentPickerAsset
): Promise<PreparedDocumentFile> {
  if (!asset.name.trim() || !asset.mimeType || !asset.size) {
    throw new DocumentFileError("missing-metadata");
  }
  if (asset.size <= 0) throw new DocumentFileError("empty");
  if (asset.size > PROJECT_DOCUMENT_MAX_BYTES) {
    throw new DocumentFileError("too-large");
  }

  const extension = getDocumentExtension(asset.name);
  if (!extension) {
    throw new DocumentFileError("unsupported-type");
  }
  const metadata = metadataByExtension[extension];
  if (metadata.mimeType !== asset.mimeType) {
    throw new DocumentFileError("unsupported-type");
  }

  const bytes = await readDocumentBytes(asset);
  const byteLength = bytes.byteLength;

  if (byteLength <= 0) throw new DocumentFileError("empty");
  if (byteLength > PROJECT_DOCUMENT_MAX_BYTES) {
    throw new DocumentFileError("too-large");
  }
  if (!hasExpectedSignature(new Uint8Array(bytes), extension)) {
    throw new DocumentFileError("invalid-signature");
  }

  return {
    bytes,
    extension,
    mimeType: metadata.mimeType,
    originalFilename: asset.name.trim(),
    size: byteLength
  };
}

export function getDocumentExtension(
  filename: string
): DocumentFileExtension | null {
  const candidate = filename.split(".").pop()?.toLocaleLowerCase();

  for (const [extension, metadata] of Object.entries(metadataByExtension)) {
    if (candidate && metadata.aliases.includes(candidate)) {
      return extension as DocumentFileExtension;
    }
  }

  return null;
}

export function getDocumentDisplayName(filename: string) {
  const trimmed = filename.trim();
  const lastDot = trimmed.lastIndexOf(".");
  const withoutExtension = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  return withoutExtension.trim() || "Document";
}

export function getProjectDocumentPath({
  documentId,
  extension,
  projectId
}: {
  documentId: string;
  extension: DocumentFileExtension;
  projectId: string;
}) {
  return `projects/${projectId}/documents/${documentId}/file.${extension}`;
}

export function sanitizeDownloadFilename(
  filename: string,
  extension: DocumentFileExtension
) {
  const sanitized = filename
    .replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
  const fallback = `document.${extension}`;

  if (!sanitized) return fallback;

  const normalizedExtension =
    getDocumentExtension(sanitized) === extension
      ? sanitized
      : `${sanitized}.${extension}`;

  return normalizedExtension;
}

function hasExpectedSignature(
  bytes: Uint8Array,
  extension: DocumentFileExtension
) {
  if (extension === "pdf") {
    return matches(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  }
  if (extension === "png") {
    return matches(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }

  return matches(bytes, [0xff, 0xd8, 0xff]);
}

function matches(bytes: Uint8Array, signature: number[]) {
  return (
    bytes.length >= signature.length &&
    signature.every((value, index) => bytes[index] === value)
  );
}
