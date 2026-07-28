import type { UserRole } from "@/features/auth/types/auth.types";
import type { ProjectFilters } from "@/features/projects/types/project.types";
import { normalizeProjectFilters } from "@/features/projects/schemas/project.schemas";

export interface ProjectListQueryPlan {
  filters: {
    column: string;
    operator: "eq" | "ilike" | "in" | "is";
    value: unknown;
  }[];
  orders: { ascending: boolean; column: string }[];
}

export function buildProjectListQueryPlan({
  filters,
  userId,
  userRole
}: {
  filters?: ProjectFilters;
  userId: string;
  userRole: UserRole;
}): ProjectListQueryPlan {
  const normalized = normalizeProjectFilters(filters);
  const queryFilters: ProjectListQueryPlan["filters"] = [
    { column: "deleted_at", operator: "is", value: null }
  ];

  if (userRole !== "admin") {
    queryFilters.push({ column: "owner_id", operator: "eq", value: userId });
  }

  if (normalized.clientId) {
    queryFilters.push({
      column: "client_id",
      operator: "eq",
      value: normalized.clientId
    });
  }

  if (normalized.statuses) {
    queryFilters.push({
      column: "status",
      operator: "in",
      value: normalized.statuses
    });
  }

  if (normalized.phases) {
    queryFilters.push({
      column: "phase",
      operator: "in",
      value: normalized.phases
    });
  }

  if (normalized.projectTypes) {
    queryFilters.push({
      column: "project_type",
      operator: "in",
      value: normalized.projectTypes
    });
  }

  if (normalized.buildingTypes) {
    queryFilters.push({
      column: "building_type",
      operator: "in",
      value: normalized.buildingTypes
    });
  }

  if (normalized.query) {
    queryFilters.push({
      column: "name",
      operator: "ilike",
      value: `%${normalized.query}%`
    });
  }

  return {
    filters: queryFilters,
    orders: [
      {
        ascending: normalized.sort.endsWith("_asc"),
        column: normalized.sort.startsWith("name") ? "name" : "created_at"
      },
      { ascending: true, column: "id" }
    ]
  };
}
