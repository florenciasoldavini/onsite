import {
  AuthDivider,
  AuthFooterLink,
  AuthStatusMessage,
  AuthShell,
  authFieldSize,
  authFormStackGap,
  authSocialButtonSize
} from "@/features/auth/components/auth-shell";
import { AppButton } from "@/shared/ui/components/button";
import { FieldMessage } from "@/shared/ui/components/field-message";
import {
  PasswordVisibilityToggle,
  TextField
} from "@/shared/ui/components/input";
import { AppLink } from "@/shared/ui/components/link";
import { atomSpacing } from "@/shared/ui/components/theme";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useEmailSignIn,
  useOAuthSignIn
} from "@/features/auth/hooks/use-auth-mutations";
import {
  createLoginSchema,
  type LoginInput
} from "@/features/auth/schemas/auth.schemas";
import { AtSignIcon, LockIcon } from "@/shared/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

const googleLogo = require("@/assets/images/auth/google-logo.png");
const appleLogo = require("@/assets/images/auth/apple-logo.png");

export default function SignInScreen({
  nextPath = "/"
}: {
  nextPath?: string;
}) {
  const router = useRouter();
  const { i18n, t } = useTranslation("features/auth");
  const hasNext = nextPath !== "/";
  const { authError, session } = useAuth();
  const emailSignIn = useEmailSignIn();
  const oauthSignIn = useOAuthSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loadingAction, setLoadingAction] = useState<
    "apple" | "email" | "google" | null
  >(null);
  const loginSchema = useMemo(
    () => createLoginSchema(t),
    [i18n.resolvedLanguage, t]
  );
  const form = useForm<LoginInput>({
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onChange",
    resolver: zodResolver(loginSchema)
  });
  const {
    control,
    formState: { isValid },
    handleSubmit,
    trigger
  } = form;
  const isBusy = loadingAction !== null;

  useEffect(() => {
    if (hasNext && session) {
      router.replace(nextPath as never);
    }
  }, [hasNext, nextPath, router, session]);

  const revealEmailSignInValidation = () => {
    void trigger();
  };

  const signInWithEmail = handleSubmit(async ({ email, password }) => {
    setLoadingAction("email");
    setFormError(null);

    try {
      const result = await emailSignIn.mutateAsync({ email, password });

      if (result.status === "email-unverified") {
        router.replace(
          `/verify-email?email=${encodeURIComponent(result.email)}${
            hasNext ? `&next=${encodeURIComponent(nextPath)}` : ""
          }`
        );
      }
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/auth"].errors.signIn)
        )
      );
    } finally {
      setLoadingAction(null);
    }
  });

  async function signInWithProvider(provider: "apple" | "google") {
    try {
      setLoadingAction(provider);
      setFormError(null);
      await oauthSignIn.mutateAsync({
        next: hasNext ? nextPath : undefined,
        provider
      });
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/auth"].errors.oauthStart)
        )
      );
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <AuthShell
      description={t(($) => $["features/auth"].signIn.description)}
      panelTag={t(($) => $["features/auth"].signIn.panelTag)}
      title={t(($) => $["features/auth"].signIn.title)}
    >
      <View style={{ gap: atomSpacing[6] }}>
        {authError ? (
          <AuthStatusMessage tone="danger">{authError}</AuthStatusMessage>
        ) : null}

        <View style={{ gap: authFormStackGap }}>
          <View
            style={{
              flexDirection: "row",
              gap: atomSpacing[3],
              justifyContent: "center"
            }}
          >
            <AppButton
              accessibilityLabel={t(
                ($) => $["features/auth"].common.google
              )}
              fullWidth={false}
              imageSource={googleLogo}
              isDisabled={isBusy}
              layout="icon"
              loading={loadingAction === "google"}
              onPress={() => {
                void signInWithProvider("google");
              }}
              shape="pill"
              size={authSocialButtonSize}
              color="neutral"
              variant="bordered"
            />
            <AppButton
              accessibilityLabel={t(
                ($) => $["features/auth"].common.apple
              )}
              fullWidth={false}
              imageSource={appleLogo}
              isDisabled={isBusy}
              layout="icon"
              loading={loadingAction === "apple"}
              onPress={() => {
                void signInWithProvider("apple");
              }}
              shape="pill"
              size={authSocialButtonSize}
              color="neutral"
              variant="bordered"
            />
          </View>

          <AuthDivider
            label={t(($) => $["features/auth"].signIn.divider)}
          />

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                autoCapitalize="none"
                autoComplete="email"
                errorText={fieldState.error?.message}
                keyboardType="email-address"
                label={t(($) => $["features/auth"].signIn.email)}
                leftIcon={AtSignIcon}
                onBlur={field.onBlur}
                onChangeText={(value) => {
                  field.onChange(value);
                  setFormError(null);
                }}
                placeholder="architect@onzait.com"
                required
                size={authFieldSize}
                textContentType="emailAddress"
                type="text"
                value={field.value}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <TextField
                accessory={
                  <AppLink href="/reset-password">
                    {t(($) => $["features/auth"].signIn.forgot)}
                  </AppLink>
                }
                autoCapitalize="none"
                autoComplete="password"
                errorText={fieldState.error?.message}
                label={t(($) => $["features/auth"].signIn.password)}
                leftIcon={LockIcon}
                onBlur={field.onBlur}
                onChangeText={(value) => {
                  field.onChange(value);
                  setFormError(null);
                }}
                placeholder="••••••••••••"
                required
                rightSlot={
                  <PasswordVisibilityToggle
                    onPress={() => {
                      setPasswordVisible((current) => !current);
                    }}
                    visible={passwordVisible}
                  />
                }
                size={authFieldSize}
                textContentType="password"
                type={passwordVisible ? "text" : "password"}
                value={field.value}
              />
            )}
          />

          <AppButton
            isDisabled={!isValid || isBusy}
            loading={loadingAction === "email"}
            onDisabledPress={
              !isValid && !isBusy ? revealEmailSignInValidation : undefined
            }
            onPress={() => {
              void signInWithEmail();
            }}
            size={authFieldSize}
          >
            {t(($) => $["features/auth"].signIn.action)}
          </AppButton>
          {formError ? (
            <FieldMessage tone="error">{formError}</FieldMessage>
          ) : null}
        </View>

        <AuthFooterLink
          actionLabel={t(
            ($) => $["features/auth"].signIn.createAccount
          )}
          href={
            hasNext
              ? (`/sign-up?next=${encodeURIComponent(nextPath)}` as never)
              : "/sign-up"
          }
          prompt={t(($) => $["features/auth"].signIn.prompt)}
        />
      </View>
    </AuthShell>
  );
}
