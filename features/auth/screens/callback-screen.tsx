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
import { useTranslation } from "react-i18next";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { t } = useTranslation("features/auth");
  const linkingUrl = Linking.useURL();
  const { mutateAsync: completeCallback } = useAuthCallbackCompletion();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [callbackIntent, setCallbackIntent] = useState<AuthCallbackIntent>({
    kind: "sign-in"
  });
  const [statusMessage, setStatusMessage] = useState<string>(
    t(($) => $["features/auth"].callback.loading)
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
            ? t(($) => $["features/auth"].callback.failureLink)
            : t(($) => $["features/auth"].callback.failureSignIn)
        );
        setErrorMessage(
          getUserFacingErrorMessage(
            error,
            intent.kind === "identity-link"
              ? t(($) => $["features/auth"].callback.failureLinkAction)
              : t(($) => $["features/auth"].callback.failureSignInAction)
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
          ? t(($) => $["features/auth"].callback.descriptionLink)
          : t(($) => $["features/auth"].callback.descriptionSignIn)
      }
      eyebrow={t(($) => $["features/auth"].callback.eyebrow)}
      panelTag={t(($) => $["features/auth"].callback.panelTag)}
      title={t(($) => $["features/auth"].callback.title)}
    >
      <View style={{ gap: atomSpacing[6] }}>
        <View style={{ gap: atomSpacing[2] }}>
          <AppText tone="muted" variant="eyebrow">
            {t(($) => $["features/auth"].callback.resolution)}
          </AppText>
          <AppHeading variant="title">
            {isIdentityLink
              ? t(($) => $["features/auth"].callback.linking, {
                  provider: providerLabel ?? ""
                })
              : t(($) => $["features/auth"].callback.signingIn)}
          </AppHeading>
          <AppText tone="muted">{statusMessage}</AppText>
        </View>

        {errorMessage ? (
          <AuthStatusMessage tone="danger">{errorMessage}</AuthStatusMessage>
        ) : (
          <AuthStatusMessage>
            <AppText variant="meta">
              {t(($) => $["features/auth"].callback.status)}
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
            {isIdentityLink
              ? t(($) => $["features/auth"].callback.backProfile)
              : t(($) => $["features/auth"].callback.backSignIn)}
          </AppButton>
        ) : null}
      </View>
    </AuthShell>
  );
}
