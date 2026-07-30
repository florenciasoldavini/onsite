import { createResetPasswordSchema } from "@/features/auth/schemas/auth.schemas";
import type { TFunction } from "i18next";
import { z } from "zod";

export const profileInfoSchema = z.object({
  avatar: z.string(),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string(),
  phoneNumber: z.string()
});

export function createProfileInfoSchema(t: TFunction<"shared">) {
  return z.object({
    avatar: z.string(),
    firstName: z
      .string()
      .trim()
      .min(1, t(($) => $.shared.validation.firstNameRequired)),
    lastName: z.string(),
    phoneNumber: z.string()
  });
}

export function createProfilePasswordSchema(
  t: TFunction<"features/auth">
) {
  return createResetPasswordSchema(t);
}

export type ProfileInfoInput = z.infer<typeof profileInfoSchema>;
export type ProfilePasswordInput = z.infer<
  ReturnType<typeof createProfilePasswordSchema>
>;
