import { PROJECT_DOCUMENT_CATEGORIES } from "@/features/documents/constants/document.constants";
import type {
  DocumentCategory,
  DocumentFormValues,
  DocumentListFilters,
  ProjectDocument
} from "@/features/documents/types/document";
import type { TFunction } from "i18next";
import { z } from "zod";

export const ProjectDocumentSchema: z.ZodType<ProjectDocument> = z.object({
  category: z.enum(PROJECT_DOCUMENT_CATEGORIES),
  created_at: z.string(),
  deleted_at: z.string().nullable(),
  file_extension: z.enum(["jpg", "pdf", "png"]),
  file_size_bytes: z.number().positive(),
  id: z.string(),
  mime_type: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  name: z.string(),
  object_path: z.string(),
  original_filename: z.string(),
  project_id: z.string(),
  updated_at: z.string().nullable(),
  uploaded_by: z.string(),
  uploaded_by_display_name: z.string()
});

export function createDocumentFormSchema(
  t: TFunction<"features/documents">
) {
  return z.object({
    category: z.enum(PROJECT_DOCUMENT_CATEGORIES),
    name: z
      .string()
      .trim()
      .min(1, t(($) => $["features/documents"].validation.nameRequired))
      .max(160, t(($) => $["features/documents"].validation.nameMax))
  });
}

export function toDocumentUpdateInput(
  values: DocumentFormValues
): DocumentFormValues {
  return {
    category: values.category,
    name: values.name.trim()
  };
}

export function normalizeDocumentFilters(filters: DocumentListFilters = {}) {
  const query = filters.query?.trim() || null;
  const category: DocumentCategory | null =
    filters.category && filters.category !== "all"
      ? filters.category
      : null;

  return { category, query };
}
