import type { TFunction } from "i18next";
import { z } from "zod";

export function createEmailSchema(t: TFunction<"features/auth">) {
  return z
    .email(t(($) => $["features/auth"].validation.emailInvalid))
    .trim()
    .min(1, t(($) => $["features/auth"].validation.emailRequired));
}

export function createPasswordSchema(t: TFunction<"features/auth">) {
  return z
    .string()
    .min(8, t(($) => $["features/auth"].validation.passwordLength))
    .regex(
      /[A-Z]/,
      t(($) => $["features/auth"].validation.passwordUppercase)
    )
    .regex(
      /[0-9]/,
      t(($) => $["features/auth"].validation.passwordNumber)
    )
    .regex(
      /[^A-Za-z0-9]/,
      t(($) => $["features/auth"].validation.passwordSpecial)
    );
}
