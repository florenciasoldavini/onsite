import type {
  Client,
  ClientFilters,
  ClientFormValues,
  ClientSort,
  CreateClientInput
} from "@/features/clients/types/client";
import { z } from "zod";

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

export const ClientSchema: z.ZodType<Client> = z.object({
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

export const clientFormSchema = z.object({
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

export function toClientInput(values: ClientFormValues): CreateClientInput {
  return {
    email: normalizeNullableText(values.email)?.toLowerCase() ?? null,
    first_name: values.first_name.trim(),
    last_name: normalizeNullableText(values.last_name),
    phone_number: normalizeNullableText(values.phone_number)
  };
}

export function normalizeClientFilters(filters: ClientFilters = {}) {
  return {
    ownerId: normalizeNullableText(filters.ownerId ?? ""),
    query: normalizeNullableText(filters.query ?? ""),
    sort: normalizeClientSort(filters.sort)
  };
}

export function getClientDisplayName(
  client: Pick<Client, "first_name" | "last_name">
) {
  return [client.first_name, client.last_name].filter(Boolean).join(" ");
}

export function getClientInitials(
  client: Pick<Client, "first_name" | "last_name">
) {
  const firstNameCharacters = Array.from(client.first_name.trim());
  const lastNameCharacters = Array.from(client.last_name?.trim() ?? "");
  const initials =
    lastNameCharacters.length > 0
      ? `${firstNameCharacters[0] ?? ""}${lastNameCharacters[0]}`
      : firstNameCharacters.slice(0, 2).join("");

  return initials.toLocaleUpperCase();
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

function normalizeNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
