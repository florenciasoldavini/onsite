import { AppButton } from "@/shared/ui/components/button";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import {
  AuthShell,
  AuthStatusMessage,
  authFormControlSize
} from "@/features/auth/components/auth-shell";
import { useAuthCallbackCompletion } from "@/features/auth/hooks/use-auth-mutations";
import {
  getOAuthProviderLabel,
  type AuthCallbackIntent
} from "@/features/auth/utils/auth-callback";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import * as Linking from "expo-linking";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const linkingUrl = Linking.useURL();
  const { mutateAsync: completeCallback } = useAuthCallbackCompletion();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [callbackIntent, setCallbackIntent] = useState<AuthCallbackIntent>({
    kind: "sign-in"
  });
  const [statusMessage, setStatusMessage] = useState(
    "Finishing secure access..."
  );

  useEffect(() => {
    let isMounted = true;

    const finishAuth = async () => {
      try {
        const result = await completeCallback(linkingUrl);

        if (!isMounted) {
          return;
        }

        setCallbackIntent(result.intent);
        router.replace(result.redirectPath as Href);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const intent =
          error instanceof Error &&
          "intent" in error &&
          typeof error.intent === "object" &&
          error.intent !== null &&
          "kind" in error.intent
            ? (error.intent as AuthCallbackIntent)
            : ({ kind: "sign-in" } as const);
        setCallbackIntent(intent);
        setStatusMessage(
          intent.kind === "identity-link"
            ? "We couldn't finish linking your account."
            : "We couldn't finish the sign-in redirect."
        );
        setErrorMessage(
          getUserFacingErrorMessage(
            error,
            intent.kind === "identity-link"
              ? "We couldn't finish linking this sign-in method. Return to your profile and try again."
              : "We couldn't finish signing you in. Return to sign in and try again."
          )
        );
      }
    };

    void finishAuth();

    return () => {
      isMounted = false;
    };
  }, [completeCallback, linkingUrl, router]);

  const isIdentityLink = callbackIntent.kind === "identity-link";
  const providerLabel = isIdentityLink
    ? getOAuthProviderLabel(callbackIntent.provider)
    : null;

  return (
    <AuthShell
      description={
        isIdentityLink
          ? "Return securely to your profile while the new sign-in method is confirmed."
          : "The redirect handoff should still feel deliberate and structured while the session finalizes."
      }
      eyebrow="Auth Callback / Redirect"
      panelTag="Auth / Callback"
      title="Completing Your Access"
    >
      <View style={{ gap: atomSpacing[6] }}>
        <View style={{ gap: atomSpacing[2] }}>
          <AppText tone="muted" variant="eyebrow">
            Redirect / Session Resolution
          </AppText>
          <AppHeading variant="title">
            {isIdentityLink ? `Linking ${providerLabel}` : "Signing You In"}
          </AppHeading>
          <AppText tone="muted">{statusMessage}</AppText>
        </View>

        {errorMessage ? (
          <AuthStatusMessage tone="danger">{errorMessage}</AuthStatusMessage>
        ) : (
          <AuthStatusMessage>
            <AppText variant="meta">
              STATUS / HANDOFF IN PROGRESS / WAITING FOR SESSION CONFIRMATION
            </AppText>
          </AuthStatusMessage>
        )}

        {errorMessage ? (
          <AppButton
            onPress={() => {
              router.replace(isIdentityLink ? "/profile" : "/sign-in");
            }}
            size={authFormControlSize}
          >
            {isIdentityLink ? "Back to Profile" : "Back to Sign In"}
          </AppButton>
        ) : null}
      </View>
    </AuthShell>
  );
}
