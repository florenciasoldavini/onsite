import { z } from "zod";
import type { TFunction } from "i18next";
import { createEmailSchema, createPasswordSchema } from "./field.schemas";

export function createLoginSchema(t: TFunction<"features/auth">) {
  return z.object({
    email: createEmailSchema(t),
    password: z
      .string()
      .min(1, t(($) => $["features/auth"].validation.passwordRequired))
  });
}

export function createEmailSignupSchema(t: TFunction<"features/auth">) {
  return z.object({
    email: createEmailSchema(t),
    password: createPasswordSchema(t)
  });
}

export function createSignupSchema(t: TFunction<"features/auth">) {
  return z
    .object({
      email: createEmailSchema(t),
      password: createPasswordSchema(t),
      confirmPassword: z
        .string()
        .min(1, t(($) => $["features/auth"].validation.confirmPassword))
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: t(($) => $["features/auth"].validation.passwordsMatch)
    });
}

export function createForgotPasswordSchema(t: TFunction<"features/auth">) {
  return z.object({
    email: createEmailSchema(t)
  });
}

export function createResetPasswordSchema(t: TFunction<"features/auth">) {
  return z
    .object({
      password: createPasswordSchema(t),
      confirmPassword: z
        .string()
        .min(1, t(($) => $["features/auth"].validation.confirmPassword))
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: t(($) => $["features/auth"].validation.passwordsMatch)
    });
}

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;
export type EmailSignupInput = z.infer<
  ReturnType<typeof createEmailSignupSchema>
>;
export type SignupInput = z.infer<ReturnType<typeof createSignupSchema>>;
export type ForgotPasswordInput = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;
export type ResetPasswordInput = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;
