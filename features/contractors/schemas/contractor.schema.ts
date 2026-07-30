import type {
  ContractorFilters,
  ContractorSort
} from "@/features/contractors/types/contractor";
import {
  createPersonContactFormSchema,
  personContactFormSchema,
  personContactRecordSchema
} from "@/shared/schemas/contact";
import {
  getPersonDisplayName,
  getPersonInitials,
  normalizeNullableText,
  toPersonContactInput
} from "@/shared/utils/contact";

export const ContractorSchema = personContactRecordSchema;
export const contractorFormSchema = personContactFormSchema;
export const createContractorFormSchema = createPersonContactFormSchema;
export const toContractorInput = toPersonContactInput;
export const getContractorDisplayName = getPersonDisplayName;
export const getContractorInitials = getPersonInitials;

export function normalizeContractorFilters(filters: ContractorFilters = {}) {
  return {
    ownerId: normalizeNullableText(filters.ownerId ?? ""),
    query: normalizeNullableText(filters.query ?? ""),
    sort: normalizeContractorSort(filters.sort)
  };
}

function normalizeContractorSort(
  sort: ContractorFilters["sort"]
): ContractorSort {
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
