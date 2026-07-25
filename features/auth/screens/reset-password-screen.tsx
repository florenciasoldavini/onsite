import {
  AuthFooterLink,
  AuthShell,
  authFieldSize
} from "@/features/auth/components/auth-shell";
import { AppButton } from "@/shared/ui/components/button";
import { FieldMessage } from "@/shared/ui/components/field-message";
import {
  PasswordVisibilityToggle,
  TextField
} from "@/shared/ui/components/input";
import { atomSpacing } from "@/shared/ui/components/theme";
import {
  usePasswordRecoveryPreparation,
  usePasswordResetRequest,
  usePasswordUpdate
} from "@/features/auth/hooks/use-auth-mutations";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput
} from "@/features/auth/schemas/auth.schemas";
import { AtSignIcon, LockIcon } from "@/shared/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

type ResetMode = "request" | "update";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const linkingUrl = Linking.useURL();
  const { mutateAsync: preparePasswordRecovery } =
    usePasswordRecoveryPreparation();
  const { mutateAsync: requestPasswordReset } = usePasswordResetRequest();
  const { mutateAsync: updatePassword } = usePasswordUpdate();
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ResetMode>("request");
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const requestForm = useForm<ForgotPasswordInput>({
    defaultValues: {
      email: ""
    },
    mode: "onChange",
    resolver: zodResolver(forgotPasswordSchema)
  });
  const updateForm = useForm<ResetPasswordInput>({
    defaultValues: {
      confirmPassword: "",
      password: ""
    },
    mode: "onChange",
    resolver: zodResolver(resetPasswordSchema)
  });
  const revealResetRequestValidation = () => {
    void requestForm.trigger();
  };
  const revealPasswordUpdateValidation = () => {
    void updateForm.trigger();
  };
  const isResetRequestValid = requestForm.formState.isValid;
  const isPasswordUpdateValid = updateForm.formState.isValid;
  const isSubmitDisabled =
    isLoading ||
    (mode === "update" ? !isPasswordUpdateValid : !isResetRequestValid);

  useEffect(() => {
    let isMounted = true;

    const prepareRecoverySession = async () => {
      try {
        setIsLoading(true);
        setFormError(null);

        const { shouldUpdatePassword } =
          await preparePasswordRecovery(linkingUrl);

        if (!isMounted) {
          return;
        }

        if (shouldUpdatePassword) {
          setMode("update");
          requestForm.clearErrors();
          updateForm.reset({
            confirmPassword: "",
            password: ""
          });
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setFormError(
          getUserFacingErrorMessage(
            error,
            "We couldn't open this password recovery link. Request a new link and try again."
          )
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void prepareRecoverySession();

    return () => {
      isMounted = false;
    };
  }, [linkingUrl, preparePasswordRecovery, requestForm, updateForm]);

  const handleResetRequest = requestForm.handleSubmit(async ({ email }) => {
    setIsLoading(true);
    setFormError(null);

    try {
      await requestPasswordReset(email);
      router.replace("/sign-in");
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          "We couldn't send the password reset email. Try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  });

  const handlePasswordUpdate = updateForm.handleSubmit(async ({ password }) => {
    setIsLoading(true);
    setFormError(null);

    try {
      await updatePassword(password);
      router.replace("/");
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          "We couldn't update your password. Try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <AuthShell
      description={
        mode === "update"
          ? "Set a new password for your account."
          : "Request a secure reset link."
      }
      panelTag={mode === "update" ? "Recovery / Update" : "Recovery / Request"}
      title={mode === "update" ? "Update Your Password" : "Reset Your Password"}
    >
      <View style={{ gap: atomSpacing[6] }}>
        <View style={{ gap: atomSpacing[4] }}>
          {mode === "request" ? (
            <Controller
              control={requestForm.control}
              name="email"
              render={({ field, fieldState }) => (
                <TextField
                  autoCapitalize="none"
                  autoComplete="email"
                  errorText={fieldState.error?.message}
                  helperText={
                    !fieldState.error
                      ? "Enter the email tied to your account."
                      : null
                  }
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
          ) : (
            <>
              <Controller
                control={updateForm.control}
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
                    label="New Password"
                    leftIcon={LockIcon}
                    onBlur={field.onBlur}
                    onChangeText={(value) => {
                      field.onChange(value);
                      setFormError(null);
                    }}
                    placeholder="new-password"
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
              <Controller
                control={updateForm.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <TextField
                    autoCapitalize="none"
                    autoComplete="new-password"
                    errorText={fieldState.error?.message}
                    label="Confirm Password"
                    leftIcon={LockIcon}
                    onBlur={field.onBlur}
                    onChangeText={(value) => {
                      field.onChange(value);
                      setFormError(null);
                    }}
                    placeholder="confirm-password"
                    required
                    rightSlot={
                      <PasswordVisibilityToggle
                        onPress={() => {
                          setConfirmPasswordVisible((current) => !current);
                        }}
                        visible={confirmPasswordVisible}
                      />
                    }
                    size={authFieldSize}
                    type={confirmPasswordVisible ? "text" : "password"}
                    value={field.value}
                  />
                )}
              />
            </>
          )}

          <AppButton
            isDisabled={isSubmitDisabled}
            loading={isLoading}
            onDisabledPress={
              !isLoading
                ? mode === "update"
                  ? !isPasswordUpdateValid
                    ? revealPasswordUpdateValidation
                    : undefined
                  : !isResetRequestValid
                    ? revealResetRequestValidation
                    : undefined
                : undefined
            }
            onPress={() => {
              if (mode === "update") {
                void handlePasswordUpdate();
              } else {
                void handleResetRequest();
              }
            }}
            size={authFieldSize}
          >
            {mode === "update" ? "Update Password" : "Send Reset Link"}
          </AppButton>
          {formError ? (
            <FieldMessage tone="error">{formError}</FieldMessage>
          ) : null}
        </View>

        <AuthFooterLink
          actionLabel="Return to Sign In"
          href="/sign-in"
          prompt="Remembered your password?"
        />
      </View>
    </AuthShell>
  );
}
