import { invokeWelcomeToOnzaitEmail } from "@/features/auth/repositories/welcome-email.repository";
import type { SupportedLanguage } from "@/features/localization/types/language";

type SendWelcomeToOnzaitEmailInput = {
  language: SupportedLanguage;
  name?: string;
};

export async function sendWelcomeToOnzaitEmail(
  input: SendWelcomeToOnzaitEmailInput
) {
  return invokeWelcomeToOnzaitEmail({
    language: input.language,
    name: input.name?.trim() || undefined
  });
}
