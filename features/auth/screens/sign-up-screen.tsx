import {
  AuthDivider,
  AuthFooterLink,
  AuthShell,
  AuthStatusMessage,
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
import { atomSpacing } from "@/shared/ui/components/theme";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useEmailSignUp,
  useOAuthSignIn
} from "@/features/auth/hooks/use-auth-mutations";
import {
  createEmailSignupSchema,
  type EmailSignupInput
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

export default function SignUpScreen({
  nextPath = "/"
}: {
  nextPath?: string;
}) {
  const router = useRouter();
  const { i18n, t } = useTranslation("features/auth");
  const hasNext = nextPath !== "/";
  const { authError, session } = useAuth();
  const emailSignUp = useEmailSignUp();
  const oauthSignIn = useOAuthSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loadingAction, setLoadingAction] = useState<
    "apple" | "email" | "google" | null
  >(null);
  const emailSignupSchema = useMemo(
    () => createEmailSignupSchema(t),
    [i18n.resolvedLanguage, t]
  );
  const form = useForm<EmailSignupInput>({
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onChange",
    resolver: zodResolver(emailSignupSchema)
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

  const revealEmailSignUpValidation = () => {
    void trigger();
  };

  const signUpWithEmail = handleSubmit(async ({ email, password }) => {
    setLoadingAction("email");
    setFormError(null);

    try {
      const result = await emailSignUp.mutateAsync({
        email,
        next: hasNext ? nextPath : undefined,
        password
      });

      if (result.status === "verification-rate-limited") {
        router.replace(
          `/verify-email?email=${encodeURIComponent(result.email)}&notice=rate-limited${
            hasNext ? `&next=${encodeURIComponent(nextPath)}` : ""
          }`
        );
      } else if (result.status === "verification-sent") {
        router.replace(
          `/verify-email?email=${encodeURIComponent(result.email)}&notice=sent${
            hasNext ? `&next=${encodeURIComponent(nextPath)}` : ""
          }`
        );
      }
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/auth"].errors.signUp)
        )
      );
    } finally {
      setLoadingAction(null);
    }
  });

  async function signUpWithProvider(provider: "apple" | "google") {
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
          t(($) => $["features/auth"].errors.oauthStartSignUp)
        )
      );
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <AuthShell
      description={t(($) => $["features/auth"].signUp.description)}
      panelTag={t(($) => $["features/auth"].signUp.panelTag)}
      title={t(($) => $["features/auth"].signUp.title)}
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
                void signUpWithProvider("google");
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
                void signUpWithProvider("apple");
              }}
              shape="pill"
              size={authSocialButtonSize}
              color="neutral"
              variant="bordered"
            />
          </View>

          <AuthDivider
            label={t(($) => $["features/auth"].signUp.divider)}
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
                label={t(($) => $["features/auth"].common.email)}
                leftIcon={AtSignIcon}
                onBlur={field.onBlur}
                onChangeText={(value) => {
                  field.onChange(value);
                  setFormError(null);
                }}
                placeholder="name@company.com"
                required
                size={authFieldSize}
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
                autoCapitalize="none"
                autoComplete="new-password"
                errorText={fieldState.error?.message}
                helperText={
                  !fieldState.error
                    ? t(($) => $["features/auth"].common.passwordHint)
                    : null
                }
                label={t(($) => $["features/auth"].common.password)}
                leftIcon={LockIcon}
                onBlur={field.onBlur}
                onChangeText={(value) => {
                  field.onChange(value);
                  setFormError(null);
                }}
                placeholder="min 8 characters"
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
                type={passwordVisible ? "text" : "password"}
                value={field.value}
              />
            )}
          />

          <AppButton
            isDisabled={!isValid || isBusy}
            loading={loadingAction === "email"}
            onDisabledPress={
              !isValid && !isBusy ? revealEmailSignUpValidation : undefined
            }
            onPress={() => {
              void signUpWithEmail();
            }}
            size={authFieldSize}
          >
            {t(($) => $["features/auth"].signUp.title)}
          </AppButton>
          {formError ? (
            <FieldMessage tone="error">{formError}</FieldMessage>
          ) : null}
        </View>

        <AuthFooterLink
          actionLabel={t(($) => $["features/auth"].signUp.signIn)}
          href={
            hasNext
              ? (`/sign-in?next=${encodeURIComponent(nextPath)}` as never)
              : "/sign-in"
          }
          prompt={t(($) => $["features/auth"].signUp.prompt)}
        />
      </View>
    </AuthShell>
  );
}
