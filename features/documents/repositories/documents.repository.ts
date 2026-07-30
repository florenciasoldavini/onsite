import { buildDocumentListQueryPlan } from "@/features/documents/repositories/document-list-query";
import { ProjectDocumentSchema } from "@/features/documents/schemas/document.schema";
import type {
  CreateProjectDocumentInput,
  DocumentListFilters,
  UpdateProjectDocumentInput
} from "@/features/documents/types/document";
import {
  requireSupabase,
  toRepositoryError
} from "@/infrastructure/supabase/repository";
import {
  getOffsetPageRange,
  toPaginatedResult,
  type OffsetPageRequest
} from "@/shared/utils/pagination";

const DOCUMENT_COLUMNS = [
  "category",
  "created_at",
  "deleted_at",
  "file_extension",
  "file_size_bytes",
  "id",
  "mime_type",
  "name",
  "object_path",
  "original_filename",
  "project_id",
  "updated_at",
  "uploaded_by",
  "uploaded_by_display_name"
].join(",");

export async function listProjectDocumentRows({
  filters,
  offset,
  pageSize,
  projectId
}: {
  filters?: DocumentListFilters;
  projectId: string;
} & OffsetPageRequest) {
  const client = requireSupabase();
  const range = getOffsetPageRange({ offset, pageSize });
  const plan = buildDocumentListQueryPlan(filters);
  let query = client
    .from("project_documents")
    .select(DOCUMENT_COLUMNS)
    .eq("project_id", projectId)
    .is("deleted_at", null);

  if (plan.category) query = query.eq("category", plan.category);
  if (plan.search) query = query.or(plan.search);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(range.from, range.to);

  if (error) throw toRepositoryError(error);
  const documents = ProjectDocumentSchema.array().parse(data ?? []);
  return toPaginatedResult(documents, range);
}

export async function getProjectDocumentRow(documentId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_documents")
    .select(DOCUMENT_COLUMNS)
    .eq("id", documentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw toRepositoryError(error);
  return data ? ProjectDocumentSchema.parse(data) : null;
}

export async function insertProjectDocumentRow(
  input: CreateProjectDocumentInput
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_documents")
    .insert(input)
    .select(DOCUMENT_COLUMNS)
    .single();

  if (error) throw toRepositoryError(error);
  return ProjectDocumentSchema.parse(data);
}

export async function updateProjectDocumentRow(
  documentId: string,
  input: UpdateProjectDocumentInput
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_documents")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", documentId)
    .is("deleted_at", null)
    .select(DOCUMENT_COLUMNS)
    .single();

  if (error) throw toRepositoryError(error);
  return ProjectDocumentSchema.parse(data);
}

export async function softDeleteProjectDocumentRow(documentId: string) {
  const client = requireSupabase();
  const deletedAt = new Date().toISOString();
  const { error } = await client
    .from("project_documents")
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq("id", documentId)
    .is("deleted_at", null);

  if (error) throw toRepositoryError(error);
}
