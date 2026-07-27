import type {
  Contractor,
  ContractorFilters,
  ContractorFormValues,
  ContractorSort,
  CreateContractorInput
} from "@/features/contractors/types/contractor";
import { z } from "zod";

export const ContractorSchema: z.ZodType<Contractor> = z.object({
  created_at: z.string(),
  deleted_at: z.string().nullable(),
  email: z.string().nullable(),
  first_name: z.string(),
  id: z.string(),
  last_name: z.string().nullable(),
  owner_id: z.string(),
  phone_number: z.string().nullable(),
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

export const contractorFormSchema = z.object({
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
  phone_number: optionalPhoneSchema
});

export function toContractorInput(
  values: ContractorFormValues
): CreateContractorInput {
  return {
    email: normalizeNullableText(values.email)?.toLowerCase() ?? null,
    first_name: values.first_name.trim(),
    last_name: normalizeNullableText(values.last_name),
    phone_number: normalizeNullableText(values.phone_number)
  };
}

export function normalizeContractorFilters(filters: ContractorFilters = {}) {
  return {
    ownerId: normalizeNullableText(filters.ownerId ?? ""),
    query: normalizeNullableText(filters.query ?? ""),
    sort: normalizeContractorSort(filters.sort)
  };
}

export function getContractorDisplayName(
  contractor: Pick<Contractor, "first_name" | "last_name">
) {
  return [contractor.first_name, contractor.last_name]
    .filter(Boolean)
    .join(" ");
}

export function getContractorInitials(
  contractor: Pick<Contractor, "first_name" | "last_name">
) {
  const firstNameCharacters = Array.from(contractor.first_name.trim());
  const lastNameCharacters = Array.from(contractor.last_name?.trim() ?? "");
  const initials =
    lastNameCharacters.length > 0
      ? `${firstNameCharacters[0] ?? ""}${lastNameCharacters[0]}`
      : firstNameCharacters.slice(0, 2).join("");

  return initials.toLocaleUpperCase();
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

function normalizeNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
