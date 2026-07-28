import type { UserRole } from "@/features/auth/types/auth.types";
import { buildProjectListQueryPlan } from "@/features/projects/repositories/project-list-query";
import {
  requireSupabase,
  toRepositoryError
} from "@/infrastructure/supabase/repository";
import type {
  CreateProjectInput,
  Project,
  ProjectFilters,
  ProjectSummary,
  UpdateProjectInput
} from "@/features/projects/types/project.types";
import {
  getOffsetPageRange,
  toPaginatedResult,
  type OffsetPageRequest
} from "@/shared/utils/pagination";
import { UserFacingError } from "@/shared/utils/user-facing-errors";

const PROJECT_SUMMARY_COLUMNS = [
  "address",
  "cover_image_path",
  "estimated_end_date",
  "id",
  "latitude",
  "longitude",
  "name",
  "phase",
  "progress_percentage",
  "project_type",
  "status"
].join(",");

export async function listProjectRows({
  filters,
  offset,
  pageSize,
  userId,
  userRole
}: {
  filters?: ProjectFilters;
  userId: string;
  userRole: UserRole;
} & OffsetPageRequest) {
  const client = requireSupabase();
  const plan = buildProjectListQueryPlan({ filters, userId, userRole });
  const range = getOffsetPageRange({ offset, pageSize });
  let query = client.from("projects").select(PROJECT_SUMMARY_COLUMNS);

  for (const filter of plan.filters) {
    if (filter.operator === "eq") {
      query = query.eq(filter.column, filter.value as string);
    } else if (filter.operator === "in") {
      query = query.in(filter.column, filter.value as string[]);
    } else if (filter.operator === "is") {
      query = query.is(filter.column, filter.value as null);
    } else if (filter.operator === "ilike") {
      query = query.ilike(filter.column, filter.value as string);
    }
  }

  for (const order of plan.orders) {
    query = query.order(order.column, { ascending: order.ascending });
  }

  const { data, error } = await query.range(range.from, range.to);

  if (error) {
    throw toRepositoryError(error);
  }

  return toPaginatedResult(
    (data ?? []) as unknown as ProjectSummary[],
    range
  );
}

export async function getProjectRow(projectId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw toRepositoryError(error);
  }

  return data ? (data as Project) : null;
}

export async function insertProjectRow(input: CreateProjectInput) {
  const client = requireSupabase();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw toRepositoryError(authError);
  }

  if (!user) {
    throw new UserFacingError("You must be signed in to save projects.");
  }

  const { data, error } = await client
    .from("projects")
    .insert({ ...input, owner_id: user.id })
    .select()
    .single();

  if (error) {
    throw toRepositoryError(error);
  }

  return data as Project;
}

export async function updateProjectRow(
  projectId: string,
  input: UpdateProjectInput
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("projects")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw toRepositoryError(error);
  }

  return data as Project;
}

export async function replaceProjectCoverPath({
  expectedCurrentPath,
  newPath,
  projectId
}: {
  expectedCurrentPath: string | null;
  newPath: string;
  projectId: string;
}) {
  const client = requireSupabase();
  let query = client
    .from("projects")
    .update({
      cover_image_path: newPath,
      updated_at: new Date().toISOString()
    })
    .eq("id", projectId)
    .is("deleted_at", null);

  query = expectedCurrentPath
    ? query.eq("cover_image_path", expectedCurrentPath)
    : query.is("cover_image_path", null);

  const { data, error } = await query.select().maybeSingle();

  if (error) {
    throw toRepositoryError(error);
  }

  if (!data) {
    throw new UserFacingError(
      "The project cover changed while this upload was in progress. Refresh and try again."
    );
  }

  return data as Project;
}

export async function softDeleteProjectRow(projectId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from("projects")
    .update({
      client_id: null,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", projectId)
    .is("deleted_at", null);

  if (error) {
    throw toRepositoryError(error);
  }
}
