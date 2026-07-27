import { TradeCategorySchema } from "@/features/trade-categories/schemas/trade-category.schema";
import type {
  CreateWorkerInput,
  Worker,
  WorkerFilters,
  WorkerFormValues,
  WorkerSort
} from "@/features/workers/types/worker";
import { z } from "zod";

export const WorkerSchema: z.ZodType<Worker> = z.object({
  contractor: z
    .object({
      email: z.string().nullable(),
      first_name: z.string(),
      id: z.string(),
      last_name: z.string().nullable(),
      owner_id: z.string(),
      phone_number: z.string().nullable()
    })
    .nullable(),
  contractor_id: z.string().nullable(),
  created_at: z.string(),
  deleted_at: z.string().nullable(),
  email: z.string().nullable(),
  first_name: z.string(),
  id: z.string(),
  last_name: z.string().nullable(),
  owner_id: z.string(),
  phone_number: z.string().nullable(),
  trade_categories: z.array(TradeCategorySchema),
  updated_at: z.string().nullable()
});

const optionalEmailSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value.length === 0 ||
      z.string().email().max(254).safeParse(value).success,
    { message: "Enter a valid email address." }
  );

const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || value.length >= 3, {
    message: "Enter a valid phone number."
  })
  .refine((value) => value.length <= 40, {
    message: "Phone number must be 40 characters or fewer."
  });

export const workerFormSchema = z.object({
  contractor_id: z.string().nullable(),
  email: optionalEmailSchema,
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(80, "First name must be 80 characters or fewer."),
  last_name: z
    .string()
    .trim()
    .max(80, "Last name must be 80 characters or fewer."),
  phone_number: optionalPhoneSchema,
  trade_category_ids: z.array(z.string())
});

export function toWorkerInput(values: WorkerFormValues): CreateWorkerInput {
  return {
    contractor_id: values.contractor_id,
    email: normalizeNullableText(values.email)?.toLowerCase() ?? null,
    first_name: values.first_name.trim(),
    last_name: normalizeNullableText(values.last_name),
    phone_number: normalizeNullableText(values.phone_number),
    trade_category_ids: [...new Set(values.trade_category_ids)].sort()
  };
}

export function normalizeWorkerFilters(filters: WorkerFilters = {}) {
  return {
    contractorId: normalizeNullableText(filters.contractorId ?? ""),
    query: normalizeNullableText(filters.query ?? ""),
    sort: normalizeWorkerSort(filters.sort),
    tradeCategoryIds: [...new Set(filters.tradeCategoryIds ?? [])].sort()
  };
}

export function getWorkerDisplayName(
  worker: Pick<Worker, "first_name" | "last_name">
) {
  return [worker.first_name, worker.last_name].filter(Boolean).join(" ");
}

export function getWorkerInitials(
  worker: Pick<Worker, "first_name" | "last_name">
) {
  const firstNameCharacters = Array.from(worker.first_name.trim());
  const lastNameCharacters = Array.from(worker.last_name?.trim() ?? "");
  const initials =
    lastNameCharacters.length > 0
      ? `${firstNameCharacters[0] ?? ""}${lastNameCharacters[0]}`
      : firstNameCharacters.slice(0, 2).join("");

  return initials.toLocaleUpperCase();
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

function normalizeNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
