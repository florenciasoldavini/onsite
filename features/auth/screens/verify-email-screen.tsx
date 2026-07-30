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
import { createEmailSchema } from "@/features/auth/schemas/field.schemas";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

const resendCooldownSeconds = 60;

export default function VerifyEmailScreen({
  email: requestedEmail,
  nextPath = "/",
  notice
}: {
  email?: string;
  nextPath?: string;
  notice?: string;
}) {
  const { i18n, t } = useTranslation("features/auth");
  const verificationResend = useEmailVerificationResend();
  const email = (requestedEmail ?? "").trim().toLowerCase();
  const hasNext = nextPath !== "/";
  const isRateLimited = notice === "rate-limited";
  const isInitialEmailSent = notice === "sent";
  const [cooldownSeconds, setCooldownSeconds] = useState(
    isRateLimited || isInitialEmailSent ? resendCooldownSeconds : 0
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const emailSchema = useMemo(
    () => createEmailSchema(t),
    [i18n.resolvedLanguage, t]
  );
  const emailResult = emailSchema.safeParse(email);
  const canResend = emailResult.success && cooldownSeconds === 0;
  const displayedSuccessMessage =
    successMessage ??
    (isInitialEmailSent ? t(($) => $["features/auth"].verify.sent) : null);

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
      setErrorMessage(t(($) => $["features/auth"].verify.invalidEmail));
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsResending(true);

    try {
      const result = await verificationResend.mutateAsync({
        email,
        next: hasNext ? nextPath : undefined
      });

      setSuccessMessage(
        result.status === "sent"
          ? t(($) => $["features/auth"].verify.sent)
          : null
      );
      setCooldownSeconds(resendCooldownSeconds);
    } catch (error) {
      setErrorMessage(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/auth"].verify.resendError)
        )
      );
    } finally {
      setIsResending(false);
    }
  }

  const resendLabel =
    cooldownSeconds > 0
      ? t(($) => $["features/auth"].verify.resendCountdown, {
          count: cooldownSeconds
        })
      : t(($) => $["features/auth"].verify.resend);

  return (
    <AuthShell
      description={t(($) => $["features/auth"].verify.description)}
      panelTag={t(($) => $["features/auth"].verify.panelTag)}
      title={t(($) => $["features/auth"].verify.title)}
    >
      <View style={{ gap: atomSpacing[6] }}>
        <View style={{ gap: atomSpacing[3] }}>
          <AppText tone="subtle" variant="label">
            {t(($) => $["features/auth"].verify.emailLabel)}
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
              {emailResult.success
                ? email
                : t(($) => $["features/auth"].verify.missingEmail)}
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

          {displayedSuccessMessage ? (
            <FieldMessage tone="success">
              {displayedSuccessMessage}
            </FieldMessage>
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
            {t(($) => $["features/auth"].verify.alreadyVerified)}
          </AppText>
          <AppLink
            href={
              hasNext
                ? (`/sign-in?next=${encodeURIComponent(nextPath)}` as never)
                : "/sign-in"
            }
          >
            {t(($) => $["features/auth"].verify.signIn)}
          </AppLink>
        </View>
      </View>
    </AuthShell>
  );
}
