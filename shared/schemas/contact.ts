import type {
  OwnedPersonContactRecord,
  PersonContactFormValues
} from "@/shared/types/contact";
import { z } from "zod";
import type { TFunction } from "i18next";

export const optionalEmailSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value.length === 0 ||
      z.string().email().max(254).safeParse(value).success,
    { message: "Enter a valid email address." }
  );

export const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || value.length >= 3, {
    message: "Enter a valid phone number."
  })
  .refine((value) => value.length <= 40, {
    message: "Phone number must be 40 characters or fewer."
  });

export const firstNameSchema = z
  .string()
  .trim()
  .min(1, "First name is required.")
  .max(80, "First name must be 80 characters or fewer.");

export const lastNameSchema = z
  .string()
  .trim()
  .max(80, "Last name must be 80 characters or fewer.");

export const personContactFormSchema = z.object({
  email: optionalEmailSchema,
  first_name: firstNameSchema,
  last_name: lastNameSchema,
  phone_number: optionalPhoneSchema
}) satisfies z.ZodType<PersonContactFormValues>;

export function createPersonContactFormSchema(t: TFunction<"shared">) {
  const optionalEmailSchema = z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 ||
        z.string().email().max(254).safeParse(value).success,
      { message: t(($) => $.shared.validation.email) }
    );

  const optionalPhoneSchema = z
    .string()
    .trim()
    .refine((value) => value.length === 0 || value.length >= 3, {
      message: t(($) => $.shared.validation.phone)
    })
    .refine((value) => value.length <= 40, {
      message: t(($) => $.shared.validation.phoneMax)
    });

  const firstNameSchema = z
    .string()
    .trim()
    .min(1, t(($) => $.shared.validation.firstNameRequired))
    .max(80, t(($) => $.shared.validation.firstNameMax));

  const lastNameSchema = z
    .string()
    .trim()
    .max(80, t(($) => $.shared.validation.lastNameMax));

  return z.object({
    email: optionalEmailSchema,
    first_name: firstNameSchema,
    last_name: lastNameSchema,
    phone_number: optionalPhoneSchema
  }) satisfies z.ZodType<PersonContactFormValues>;
}

export const personContactRecordSchema = z.object({
  created_at: z.string(),
  deleted_at: z.string().nullable(),
  email: z.string().nullable(),
  first_name: z.string(),
  id: z.string(),
  last_name: z.string().nullable(),
  owner_id: z.string(),
  phone_number: z.string().nullable(),
  updated_at: z.string().nullable()
}) satisfies z.ZodType<OwnedPersonContactRecord>;

export const personContactSummarySchema = personContactRecordSchema.pick({
  email: true,
  first_name: true,
  id: true,
  last_name: true,
  owner_id: true,
  phone_number: true
});
