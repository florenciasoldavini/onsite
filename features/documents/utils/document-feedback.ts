import type { DocumentUploadStage } from "@/features/documents/types/document";
import { DocumentFileError } from "@/features/documents/utils/document-file";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import type { TFunction } from "i18next";

export function getDocumentUploadErrorMessage(
  error: unknown,
  t: TFunction<"features/documents">
) {
  if (error instanceof DocumentFileError) {
    switch (error.code) {
      case "empty":
        return t(($) => $["features/documents"].fileErrors.empty);
      case "invalid-signature":
        return t(
          ($) => $["features/documents"].fileErrors.invalidSignature
        );
      case "missing-metadata":
        return t(
          ($) => $["features/documents"].fileErrors.missingMetadata
        );
      case "too-large":
        return t(($) => $["features/documents"].fileErrors.tooLarge);
      case "unsupported-type":
        return t(
          ($) => $["features/documents"].fileErrors.unsupportedType
        );
    }
  }

  return getUserFacingErrorMessage(
    error,
    t(($) => $["features/documents"].errors.upload)
  );
}

export function getDocumentUploadStageLabel(
  stage: DocumentUploadStage,
  t: TFunction<"features/documents">
) {
  switch (stage) {
    case "cancelled":
      return t(($) => $["features/documents"].stage.cancelled);
    case "validating":
      return t(($) => $["features/documents"].stage.validating);
    case "uploading":
      return t(($) => $["features/documents"].stage.uploading);
    case "saving":
      return t(($) => $["features/documents"].stage.saving);
    case "saved":
      return t(($) => $["features/documents"].stage.saved);
    case "failed":
      return t(($) => $["features/documents"].stage.failed);
  }
}
