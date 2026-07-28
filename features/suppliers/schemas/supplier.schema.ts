import type {
  CreateSupplierInput,
  Supplier,
  SupplierFilters,
  SupplierFormValues,
  SupplierSort
} from "@/features/suppliers/types/supplier";
import {
  optionalEmailSchema,
  optionalPhoneSchema
} from "@/shared/schemas/contact";
import {
  normalizeEmailInput,
  normalizeNullableText
} from "@/shared/utils/contact";
import { z } from "zod";

export const SupplierSchema: z.ZodType<Supplier> = z.object({
  address: z.string().nullable(),
  contact_name: z.string().nullable(),
  created_at: z.string(),
  deleted_at: z.string().nullable(),
  email: z.string().nullable(),
  google_place_id: z.string().nullable(),
  id: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  name: z.string(),
  notes: z.string().nullable(),
  owner_id: z.string(),
  phone_number: z.string().nullable(),
  updated_at: z.string().nullable(),
  website_url: z.string().nullable()
});

const optionalWebsiteSchema = z
  .string()
  .trim()
  .max(2048, "Website must be 2048 characters or fewer.")
  .refine(
    (value) => value.length === 0 || normalizeWebsiteUrl(value) !== null,
    { message: "Enter a valid HTTP or HTTPS website." }
  );

const resolvedAddressSchema = z
  .object({
    address: z.string().trim().min(4).max(500),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    placeId: z.string().trim().min(3).max(255)
  })
  .nullable();

export const supplierFormSchema = z.object({
  address: resolvedAddressSchema,
  contact_name: z
    .string()
    .trim()
    .max(160, "Contact name must be 160 characters or fewer."),
  email: optionalEmailSchema,
  name: z
    .string()
    .trim()
    .min(2, "Supplier name must be at least 2 characters.")
    .max(120, "Supplier name must be 120 characters or fewer."),
  notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer."),
  phone_number: optionalPhoneSchema,
  website_url: optionalWebsiteSchema
});

export function toSupplierInput(
  values: SupplierFormValues
): CreateSupplierInput {
  return {
    address: values.address?.address.trim() ?? null,
    contact_name: normalizeNullableText(values.contact_name),
    email: normalizeEmailInput(values.email),
    google_place_id: values.address?.placeId.trim() ?? null,
    latitude: values.address?.latitude ?? null,
    longitude: values.address?.longitude ?? null,
    name: values.name.trim(),
    notes: normalizeNullableText(values.notes),
    phone_number: normalizeNullableText(values.phone_number),
    website_url: normalizeWebsiteUrl(values.website_url)
  };
}

export function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    url.hostname = url.hostname.toLowerCase();
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function normalizeSupplierFilters(filters: SupplierFilters = {}) {
  return {
    ownerId: normalizeNullableText(filters.ownerId ?? ""),
    query: normalizeNullableText(filters.query ?? ""),
    sort: normalizeSupplierSort(filters.sort)
  };
}

export function getSupplierInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toLocaleUpperCase();
}

function normalizeSupplierSort(sort: SupplierFilters["sort"]): SupplierSort {
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
