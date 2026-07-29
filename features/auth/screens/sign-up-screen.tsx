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
  emailSignupSchema,
  type EmailSignupInput
} from "@/features/auth/schemas/auth.schemas";
import { AtSignIcon, LockIcon } from "@/shared/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

const googleLogo = require("@/assets/images/auth/google-logo.png");
const appleLogo = require("@/assets/images/auth/apple-logo.png");

export default function SignUpScreen({
  nextPath = "/"
}: {
  nextPath?: string;
}) {
  const router = useRouter();
  const hasNext = nextPath !== "/";
  const { authError, session } = useAuth();
  const emailSignUp = useEmailSignUp();
  const oauthSignIn = useOAuthSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loadingAction, setLoadingAction] = useState<
    "apple" | "email" | "google" | null
  >(null);
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
          "We couldn't create your account. Check your details and try again."
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
          "We couldn't start that sign-up method. Try again."
        )
      );
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <AuthShell
      description="Create your workspace access."
      panelTag="Access / New Session"
      title="Create Account"
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
              accessibilityLabel="Continue with Google"
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
              accessibilityLabel="Continue with Apple"
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

          <AuthDivider label="OR CREATE WITH EMAIL" />

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                autoCapitalize="none"
                autoComplete="email"
                errorText={fieldState.error?.message}
                keyboardType="email-address"
                label="Email"
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
                    ? "Use 8+ chars with uppercase, number, and symbol."
                    : null
                }
                label="Password"
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
            Create Account
          </AppButton>
          {formError ? (
            <FieldMessage tone="error">{formError}</FieldMessage>
          ) : null}
        </View>

        <AuthFooterLink
          actionLabel="Sign In"
          href={
            hasNext
              ? (`/sign-in?next=${encodeURIComponent(nextPath)}` as never)
              : "/sign-in"
          }
          prompt="Already have an account?"
        />
      </View>
    </AuthShell>
  );
}
