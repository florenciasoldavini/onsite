import { normalizeClientFilters } from "@/features/clients/schemas/client.schema";
import type {
  ClientFilters,
  ClientSort
} from "@/features/clients/types/client";

export interface ClientListQueryPlan {
  filters: {
    column: string;
    operator: "eq" | "is" | "or";
    value: string | null;
  }[];
  orders: { ascending: boolean; column: string }[];
}

export function buildClientListQueryPlan({
  filters,
  userId,
  userRole
}: {
  filters?: ClientFilters;
  userId: string;
  userRole: "admin" | "user";
}): ClientListQueryPlan {
  const normalized = normalizeClientFilters(filters);
  const ownerId = userRole === "admin" ? normalized.ownerId : userId;
  const queryFilters: ClientListQueryPlan["filters"] = [
    { column: "deleted_at", operator: "is", value: null }
  ];

  if (ownerId) {
    queryFilters.push({
      column: "owner_id",
      operator: "eq",
      value: ownerId
    });
  }

  if (normalized.query) {
    queryFilters.push({
      column: "",
      operator: "or",
      value: buildClientSearchFilter(normalized.query)
    });
  }

  return {
    filters: queryFilters,
    orders: getClientOrders(normalized.sort)
  };
}

export function buildClientSearchFilter(query: string) {
  const escaped = query.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  const pattern = `"%${escaped}%"`;

  return [
    `first_name.ilike.${pattern}`,
    `last_name.ilike.${pattern}`,
    `phone_number.ilike.${pattern}`,
    `email.ilike.${pattern}`
  ].join(",");
}

function getClientOrders(sort: ClientSort) {
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
