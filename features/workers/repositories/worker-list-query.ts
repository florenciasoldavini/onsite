import type { UserRole } from "@/features/auth/types/auth.types";
import { normalizeWorkerFilters } from "@/features/workers/schemas/worker.schema";
import type {
  WorkerFilters,
  WorkerSort
} from "@/features/workers/types/worker";

export interface WorkerListQueryPlan {
  filters: {
    column: string;
    operator: "eq" | "in" | "is" | "or";
    value: string | string[] | null;
  }[];
  orders: { ascending: boolean; column: string }[];
}

export function buildWorkerListQueryPlan({
  filters,
  userId,
  userRole
}: {
  filters?: WorkerFilters;
  userId: string;
  userRole: UserRole;
}): WorkerListQueryPlan {
  const normalized = normalizeWorkerFilters(filters);
  const queryFilters: WorkerListQueryPlan["filters"] = [
    { column: "deleted_at", operator: "is", value: null }
  ];

  if (userRole !== "admin") {
    queryFilters.push({
      column: "owner_id",
      operator: "eq",
      value: userId
    });
  }

  if (normalized.contractorId) {
    queryFilters.push({
      column: "contractor_id",
      operator: "eq",
      value: normalized.contractorId
    });
  }

  if (normalized.tradeCategoryIds.length > 0) {
    queryFilters.push({
      column: "trade_filter.trade_category_id",
      operator: "in",
      value: normalized.tradeCategoryIds
    });
  }

  if (normalized.query) {
    queryFilters.push({
      column: "",
      operator: "or",
      value: buildWorkerSearchFilter(normalized.query)
    });
  }

  return {
    filters: queryFilters,
    orders: getWorkerOrders(normalized.sort)
  };
}

export function buildWorkerSearchFilter(query: string) {
  const escaped = query.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  const pattern = `"%${escaped}%"`;

  return [
    `first_name.ilike.${pattern}`,
    `last_name.ilike.${pattern}`,
    `phone_number.ilike.${pattern}`,
    `email.ilike.${pattern}`
  ].join(",");
}

function getWorkerOrders(sort: WorkerSort) {
  if (sort.startsWith("name")) {
    return [
      { ascending: sort === "name_asc", column: "first_name" },
      { ascending: sort === "name_asc", column: "last_name" },
      { ascending: true, column: "id" }
    ];
  }

  return [
    { ascending: sort === "created_asc", column: "created_at" },
    { ascending: true, column: "id" }
  ];
}
