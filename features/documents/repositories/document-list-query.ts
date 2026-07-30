import { normalizeDocumentFilters } from "@/features/documents/schemas/document.schema";
import type { DocumentListFilters } from "@/features/documents/types/document";

export function buildDocumentSearchFilter(query: string) {
  const escaped = query.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  const pattern = `"%${escaped}%"`;
  return [
    `name.ilike.${pattern}`,
    `original_filename.ilike.${pattern}`
  ].join(",");
}

export function buildDocumentListQueryPlan(filters: DocumentListFilters = {}) {
  const normalized = normalizeDocumentFilters(filters);
  return {
    category: normalized.category,
    search: normalized.query
      ? buildDocumentSearchFilter(normalized.query)
      : null
  };
}
