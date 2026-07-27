import { buildWorkerListQueryPlan } from "@/features/workers/repositories/worker-list-query";
import type {
  CreateWorkerInput,
  UpdateWorkerInput,
  Worker,
  WorkerFilters,
  WorkerSummary
} from "@/features/workers/types/worker";
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

const WORKER_RELATION_COLUMNS = `
  contractor:contractors(
    email,
    first_name,
    id,
    last_name,
    owner_id,
    phone_number
  ),
  worker_trade_categories(
    trade_category:trade_categories(
      code,
      created_at,
      deleted_at,
      id,
      updated_at
    )
  )
`;

const WORKER_SUMMARY_COLUMNS = `
  contractor_id,
  email,
  first_name,
  id,
  last_name,
  owner_id,
  phone_number,
  ${WORKER_RELATION_COLUMNS}
`;

const WORKER_DETAIL_COLUMNS = `
  contractor_id,
  created_at,
  deleted_at,
  email,
  first_name,
  id,
  last_name,
  owner_id,
  phone_number,
  updated_at,
  ${WORKER_RELATION_COLUMNS}
`;

const WORKER_FILTERED_SUMMARY_COLUMNS = `
  ${WORKER_SUMMARY_COLUMNS},
  trade_filter:worker_trade_categories!inner(trade_category_id)
`;

export async function listWorkerRows({
  filters,
  offset,
  pageSize,
  userId,
  userRole
}: {
  filters?: WorkerFilters;
  userId: string;
  userRole: "admin" | "user";
} & OffsetPageRequest) {
  const client = requireSupabase();
  const plan = buildWorkerListQueryPlan({ filters, userId, userRole });
  const range = getOffsetPageRange({ offset, pageSize });
  const hasTradeFilter = plan.filters.some(
    (filter) => filter.operator === "in"
  );
  const selectedColumns: string = hasTradeFilter
    ? WORKER_FILTERED_SUMMARY_COLUMNS
    : WORKER_SUMMARY_COLUMNS;
  let query = client.from("workers").select(selectedColumns);

  for (const filter of plan.filters) {
    if (filter.operator === "eq") {
      query = query.eq(filter.column, filter.value as string);
    } else if (filter.operator === "in") {
      query = query.in(filter.column, filter.value as string[]);
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

  return toPaginatedResult(
    ((data ?? []) as unknown as Record<string, unknown>[]).map(
      toWorker
    ) as WorkerSummary[],
    range
  );
}

export async function getWorkerRow(workerId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("workers")
    .select(WORKER_DETAIL_COLUMNS)
    .eq("id", workerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw toRepositoryError(error);
  }

  return data ? toWorker(data) : null;
}

export async function insertWorkerRow(input: CreateWorkerInput) {
  const client = requireSupabase();
  const { data, error } = await client
    .rpc("create_worker_with_relationships", toRpcInput(input))
    .single();

  if (error) {
    throw toRepositoryError(error);
  }

  const worker = await getWorkerRow((data as { id: string }).id);
  if (!worker) {
    throw new UserFacingError(
      "The worker was saved, but we couldn't reload the profile. Try again."
    );
  }

  return worker;
}

export async function updateWorkerRow(
  workerId: string,
  input: UpdateWorkerInput
) {
  const client = requireSupabase();
  const { data, error } = await client
    .rpc("update_worker_with_relationships", {
      p_worker_id: workerId,
      ...toRpcInput(input)
    })
    .single();

  if (error) {
    throw toRepositoryError(error);
  }

  const worker = await getWorkerRow((data as { id: string }).id);
  if (!worker) {
    throw new UserFacingError(
      "The worker was updated, but we couldn't reload the profile. Try again."
    );
  }

  return worker;
}

export async function softDeleteWorkerRow(workerId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from("workers")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", workerId)
    .is("deleted_at", null);

  if (error) {
    throw toRepositoryError(error);
  }
}

function toRpcInput(input: CreateWorkerInput) {
  return {
    p_contractor_id: input.contractor_id,
    p_email: input.email,
    p_first_name: input.first_name,
    p_last_name: input.last_name,
    p_phone_number: input.phone_number,
    p_trade_category_ids: input.trade_category_ids
  };
}

function toWorker(row: Record<string, unknown>): Worker {
  const links = Array.isArray(row.worker_trade_categories)
    ? row.worker_trade_categories
    : [];
  const tradeCategories = links
    .map((link) =>
      link && typeof link === "object"
        ? (link as { trade_category?: unknown }).trade_category
        : null
    )
    .filter((category): category is Worker["trade_categories"][number] =>
      Boolean(category)
    )
    .sort((left, right) => left.code.localeCompare(right.code));

  return {
    contractor: (row.contractor as Worker["contractor"]) ?? null,
    contractor_id: (row.contractor_id as string | null) ?? null,
    created_at: (row.created_at as string) ?? "",
    deleted_at: (row.deleted_at as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    first_name: row.first_name as string,
    id: row.id as string,
    last_name: (row.last_name as string | null) ?? null,
    owner_id: row.owner_id as string,
    phone_number: (row.phone_number as string | null) ?? null,
    trade_categories: tradeCategories,
    updated_at: (row.updated_at as string | null) ?? null
  };
}
