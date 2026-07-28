import type { UserRole } from "@/features/auth/types/auth.types";
import { buildClientListQueryPlan } from "@/features/clients/repositories/client-list-query";
import type {
  Client,
  ClientFilters,
  ClientSummary,
  CreateClientInput,
  UpdateClientInput
} from "@/features/clients/types/client";
import {
  requireSupabase,
  toRepositoryError
} from "@/infrastructure/supabase/repository";
import {
  getOffsetPageRange,
  toPaginatedResult,
  type OffsetPageRequest
} from "@/shared/utils/pagination";
import { UserFacingError } from "@/shared/utils/user-facing-errors";

const CLIENT_SUMMARY_COLUMNS = [
  "email",
  "first_name",
  "id",
  "last_name",
  "owner_id",
  "phone_number"
].join(",");

export async function listClientRows({
  filters,
  offset,
  pageSize,
  userId,
  userRole
}: {
  filters?: ClientFilters;
  userId: string;
  userRole: UserRole;
} & OffsetPageRequest) {
  const client = requireSupabase();
  const plan = buildClientListQueryPlan({ filters, userId, userRole });
  const range = getOffsetPageRange({ offset, pageSize });
  let query = client.from("clients").select(CLIENT_SUMMARY_COLUMNS);

  for (const filter of plan.filters) {
    if (filter.operator === "eq") {
      query = query.eq(filter.column, filter.value as string);
    } else if (filter.operator === "is") {
      query = query.is(filter.column, filter.value);
    } else {
      query = query.or(filter.value as string);
    }
  }

  for (const order of plan.orders) {
    query = query.order(order.column, { ascending: order.ascending });
  }

  const { data, error } = await query.range(range.from, range.to);

  if (error) {
    throw toRepositoryError(error);
  }

  return toPaginatedResult((data ?? []) as unknown as ClientSummary[], range);
}

export async function getClientRow(clientId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw toRepositoryError(error);
  }

  return data ? (data as Client) : null;
}

export async function insertClientRow(input: CreateClientInput) {
  const client = requireSupabase();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw toRepositoryError(authError);
  }

  if (!user) {
    throw new UserFacingError("You must be signed in to save clients.");
  }

  const { data, error } = await client
    .from("clients")
    .insert({ ...input, owner_id: user.id })
    .select()
    .single();

  if (error) {
    throw toRepositoryError(error);
  }

  return data as Client;
}

export async function updateClientRow(
  clientId: string,
  input: UpdateClientInput
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("clients")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", clientId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw toRepositoryError(error);
  }

  return data as Client;
}

export async function countClientProjectRows(clientId: string) {
  const client = requireSupabase();
  const { count, error } = await client
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .is("deleted_at", null);

  if (error) {
    throw toRepositoryError(error);
  }

  return count ?? 0;
}

export async function softDeleteClientRow(clientId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from("clients")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", clientId)
    .is("deleted_at", null);

  if (error) {
    throw toRepositoryError(error);
  }
}
