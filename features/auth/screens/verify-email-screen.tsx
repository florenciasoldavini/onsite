import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { FieldMessage } from "@/shared/ui/components/field-message";
import { AppLink } from "@/shared/ui/components/link";
import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import {
  AuthShell,
  authFormControlSize
} from "@/features/auth/components/auth-shell";
import { useEmailVerificationResend } from "@/features/auth/hooks/use-auth-mutations";
import { emailSchema } from "@/features/auth/schemas/field.schemas";
import { getSafePostAuthRedirectPath } from "@/features/auth/utils/auth-callback";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

const resendCooldownSeconds = 60;

function getEmailParam(email: string | string[] | undefined) {
  if (Array.isArray(email)) {
    return email[0] ?? "";
  }

  return email ?? "";
}

export default function VerifyEmailScreen() {
  const verificationResend = useEmailVerificationResend();
  const {
    email: emailParam,
    next: nextParam,
    notice: noticeParam
  } = useLocalSearchParams<{
    email?: string | string[];
    next?: string | string[];
    notice?: string | string[];
  }>();
  const email = getEmailParam(emailParam).trim().toLowerCase();
  const notice = getEmailParam(noticeParam);
  const next = getSafePostAuthRedirectPath(nextParam);
  const hasNext = next !== "/";
  const isRateLimited = notice === "rate-limited";
  const isInitialEmailSent = notice === "sent";
  const [cooldownSeconds, setCooldownSeconds] = useState(
    isRateLimited || isInitialEmailSent ? resendCooldownSeconds : 0
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    isInitialEmailSent
      ? "Verification link sent. Check your inbox and spam folder."
      : null
  );
  const [isResending, setIsResending] = useState(false);
  const emailResult = emailSchema.safeParse(email);
  const canResend = emailResult.success && cooldownSeconds === 0;

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setCooldownSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [cooldownSeconds]);

  async function resendEmail() {
    if (!emailResult.success) {
      setErrorMessage("Go back to sign up and enter a valid email address.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsResending(true);

    try {
      const result = await verificationResend.mutateAsync({
        email,
        next: hasNext ? next : undefined
      });

      setSuccessMessage(
        result.status === "sent"
          ? "Verification link sent. Check your inbox and spam folder."
          : null
      );
      setCooldownSeconds(resendCooldownSeconds);
    } catch (error) {
      setErrorMessage(
        getUserFacingErrorMessage(
          error,
          "We couldn't resend the verification email. Try again."
        )
      );
    } finally {
      setIsResending(false);
    }
  }

  const resendLabel =
    cooldownSeconds > 0
      ? `Resend in ${cooldownSeconds}s`
      : "Resend Verification Link";

  return (
    <AuthShell
      description="Confirm your email address before entering the workspace."
      panelTag="Access / Verify Email"
      title="Check Your Email"
    >
      <View style={{ gap: atomSpacing[6] }}>
        <View style={{ gap: atomSpacing[3] }}>
          <AppText tone="subtle" variant="label">
            Email address
          </AppText>
          <AppCard
            padding="sm"
            tone="muted"
            style={{
              borderColor: atomPalette.border,
              borderRadius: atomRadii.md
            }}
          >
            <AppText>
              {emailResult.success ? email : "No email address was provided."}
            </AppText>
          </AppCard>
        </View>

        <View style={{ gap: atomSpacing[3] }}>
          <AppButton
            isDisabled={!canResend}
            loading={isResending}
            onPress={() => {
              void resendEmail();
            }}
            size={authFormControlSize}
          >
            {resendLabel}
          </AppButton>

          {successMessage ? (
            <FieldMessage tone="success">{successMessage}</FieldMessage>
          ) : null}
          {errorMessage ? (
            <FieldMessage tone="error">{errorMessage}</FieldMessage>
          ) : null}
        </View>

        <View
          style={{
            alignItems: "center",
            borderTopColor: atomPalette.border,
            borderTopWidth: 1,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: atomSpacing[2],
            justifyContent: "center",
            paddingTop: atomSpacing[5]
          }}
        >
          <AppText style={{ textAlign: "center" }} tone="muted">
            Already verified it?
          </AppText>
          <AppLink
            href={
              hasNext
                ? (`/sign-in?next=${encodeURIComponent(next)}` as never)
                : "/sign-in"
            }
          >
            Sign In
          </AppLink>
        </View>
      </View>
    </AuthShell>
  );
}
