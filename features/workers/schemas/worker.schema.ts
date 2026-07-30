import { TradeCategorySchema } from "@/features/trade-categories/schemas/trade-category.schema";
import type {
  CreateWorkerInput,
  WorkerFilters,
  WorkerFormValues,
  WorkerSort
} from "@/features/workers/types/worker";
import {
  createPersonContactFormSchema,
  personContactFormSchema,
  personContactRecordSchema,
  personContactSummarySchema
} from "@/shared/schemas/contact";
import {
  getPersonDisplayName,
  getPersonInitials,
  normalizeNullableText,
  toPersonContactInput
} from "@/shared/utils/contact";
import { z } from "zod";

export const WorkerSchema = personContactRecordSchema.extend({
  contractor: personContactSummarySchema.nullable(),
  contractor_id: z.string().nullable(),
  trade_categories: z.array(TradeCategorySchema)
});

export const workerFormSchema = personContactFormSchema.extend({
  contractor_id: z.string().nullable(),
  trade_category_ids: z.array(z.string())
});

export const createWorkerFormSchema = (
  t: Parameters<typeof createPersonContactFormSchema>[0]
) =>
  createPersonContactFormSchema(t).extend({
    contractor_id: z.string().nullable(),
    trade_category_ids: z.array(z.string())
  });

export function toWorkerInput(values: WorkerFormValues): CreateWorkerInput {
  return {
    ...toPersonContactInput(values),
    contractor_id: values.contractor_id,
    trade_category_ids: [...new Set(values.trade_category_ids)].sort()
  };
}

export const getWorkerDisplayName = getPersonDisplayName;
export const getWorkerInitials = getPersonInitials;

export function normalizeWorkerFilters(filters: WorkerFilters = {}) {
  return {
    contractorId: normalizeNullableText(filters.contractorId ?? ""),
    query: normalizeNullableText(filters.query ?? ""),
    sort: normalizeWorkerSort(filters.sort),
    tradeCategoryIds: [...new Set(filters.tradeCategoryIds ?? [])].sort()
  };
}

function normalizeWorkerSort(sort: WorkerFilters["sort"]): WorkerSort {
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
