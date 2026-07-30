import {
  finishAuthCallback,
  preparePasswordRecovery,
  resendEmailVerification,
  sendPasswordReset,
  signInWithEmail,
  signInWithOAuth,
  signUpWithEmail,
  updateAccountPassword
} from "@/features/auth/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { useLocalization } from "@/features/localization/hooks/use-localization";

export function useEmailSignIn() {
  return useMutation({ mutationFn: signInWithEmail });
}

export function useEmailSignUp() {
  const { language } = useLocalization();
  return useMutation({
    mutationFn: (input: Omit<Parameters<typeof signUpWithEmail>[0], "language">) =>
      signUpWithEmail({ ...input, language })
  });
}

export function useOAuthSignIn() {
  return useMutation({ mutationFn: signInWithOAuth });
}

export function usePasswordResetRequest() {
  const { language } = useLocalization();
  return useMutation({
    mutationFn: (email: string) => sendPasswordReset(email, language)
  });
}

export function usePasswordRecoveryPreparation() {
  return useMutation({ mutationFn: preparePasswordRecovery });
}

export function usePasswordUpdate() {
  return useMutation({ mutationFn: updateAccountPassword });
}

export function useEmailVerificationResend() {
  const { language } = useLocalization();
  return useMutation({
    mutationFn: (input: Parameters<typeof resendEmailVerification>[0]) =>
      resendEmailVerification(input, language)
  });
}

export function useAuthCallbackCompletion() {
  return useMutation({ mutationFn: finishAuthCallback });
}
