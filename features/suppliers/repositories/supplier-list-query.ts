import { normalizeSupplierFilters } from "@/features/suppliers/schemas/supplier.schema";
import type {
  SupplierFilters,
  SupplierSort
} from "@/features/suppliers/types/supplier";

export interface SupplierListQueryPlan {
  filters: {
    column: string;
    operator: "eq" | "is" | "or";
    value: string | null;
  }[];
  orders: { ascending: boolean; column: string }[];
}

export function buildSupplierListQueryPlan({
  filters,
  userId,
  userRole
}: {
  filters?: SupplierFilters;
  userId: string;
  userRole: "admin" | "user";
}): SupplierListQueryPlan {
  const normalized = normalizeSupplierFilters(filters);
  const ownerId = userRole === "admin" ? normalized.ownerId : userId;
  const queryFilters: SupplierListQueryPlan["filters"] = [
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
      value: buildSupplierSearchFilter(normalized.query)
    });
  }

  return {
    filters: queryFilters,
    orders: getSupplierOrders(normalized.sort)
  };
}

export function buildSupplierSearchFilter(query: string) {
  const escaped = query.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  const pattern = `"%${escaped}%"`;

  return [
    `name.ilike.${pattern}`,
    `contact_name.ilike.${pattern}`,
    `phone_number.ilike.${pattern}`,
    `email.ilike.${pattern}`,
    `website_url.ilike.${pattern}`,
    `address.ilike.${pattern}`
  ].join(",");
}

function getSupplierOrders(sort: SupplierSort) {
  if (sort.startsWith("name")) {
    return [
      { ascending: sort === "name_asc", column: "name" },
      { ascending: true, column: "id" }
    ];
  }

  return [
    { ascending: sort === "created_asc", column: "created_at" },
    { ascending: true, column: "id" }
  ];
}
