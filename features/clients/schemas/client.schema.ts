import type {
  ClientFilters,
  ClientSort
} from "@/features/clients/types/client";
import {
  personContactFormSchema,
  personContactRecordSchema
} from "@/shared/schemas/contact";
import {
  getPersonDisplayName,
  getPersonInitials,
  normalizeNullableText,
  toPersonContactInput
} from "@/shared/utils/contact";

export const ClientSchema = personContactRecordSchema;
export const clientFormSchema = personContactFormSchema;
export const toClientInput = toPersonContactInput;
export const getClientDisplayName = getPersonDisplayName;
export const getClientInitials = getPersonInitials;

export function normalizeClientFilters(filters: ClientFilters = {}) {
  return {
    ownerId: normalizeNullableText(filters.ownerId ?? ""),
    query: normalizeNullableText(filters.query ?? ""),
    sort: normalizeClientSort(filters.sort)
  };
}

function normalizeClientSort(sort: ClientFilters["sort"]): ClientSort {
  switch (sort) {
    case "created_asc":
    case "name_asc":
    case "name_desc":
      return sort;
    case "created_desc":
    default:
      return "created_desc";
  }
}
