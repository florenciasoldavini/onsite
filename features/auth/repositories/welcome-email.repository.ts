import { getSupabaseErrorMessage, supabase } from "@/infrastructure/supabase/client";
import type { SupportedLanguage } from "@/features/localization/types/language";

type SendWelcomeToOnzaitEmailInput = {
  language: SupportedLanguage;
  name?: string;
};

type WelcomeToOnzaitResponse = {
  id?: string;
  ok: boolean;
  skipped?: boolean;
  welcome_email_sent_at?: string;
};

export async function invokeWelcomeToOnzaitEmail(
  input: SendWelcomeToOnzaitEmailInput
) {
  if (!supabase) {
    throw new Error(getSupabaseErrorMessage("Supabase is not configured."));
  }

  const { data, error } =
    await supabase.functions.invoke<WelcomeToOnzaitResponse>(
      "welcome-to-onzait",
      {
        body: input
      }
    );

  if (error) {
    throw error;
  }

  return data;
}
