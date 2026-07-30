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
  createForgotPasswordSchema,
  createResetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput
} from "@/features/auth/schemas/auth.schemas";
import { AtSignIcon, LockIcon } from "@/shared/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

type ResetMode = "request" | "update";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { i18n, t } = useTranslation("features/auth");
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
  const forgotPasswordSchema = useMemo(
    () => createForgotPasswordSchema(t),
    [i18n.resolvedLanguage, t]
  );
  const resetPasswordSchema = useMemo(
    () => createResetPasswordSchema(t),
    [i18n.resolvedLanguage, t]
  );
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
            t(($) => $["features/auth"].reset.invalidLink)
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
          t(($) => $["features/auth"].reset.requestError)
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
          t(($) => $["features/auth"].reset.updateError)
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
          ? t(($) => $["features/auth"].reset.descriptionUpdate)
          : t(($) => $["features/auth"].reset.descriptionRequest)
      }
      panelTag={
        mode === "update"
          ? t(($) => $["features/auth"].reset.panelUpdate)
          : t(($) => $["features/auth"].reset.panelRequest)
      }
      title={
        mode === "update"
          ? t(($) => $["features/auth"].reset.titleUpdate)
          : t(($) => $["features/auth"].reset.titleRequest)
      }
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
                      ? t(($) => $["features/auth"].reset.emailHint)
                      : null
                  }
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
                        ? t(($) => $["features/auth"].common.passwordHint)
                        : null
                    }
                    label={t(($) => $["features/auth"].reset.newPassword)}
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
                    label={t(
                      ($) => $["features/auth"].reset.confirmPassword
                    )}
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
            {mode === "update"
              ? t(($) => $["features/auth"].reset.updateAction)
              : t(($) => $["features/auth"].reset.requestAction)}
          </AppButton>
          {formError ? (
            <FieldMessage tone="error">{formError}</FieldMessage>
          ) : null}
        </View>

        <AuthFooterLink
          actionLabel={t(($) => $["features/auth"].reset.returnSignIn)}
          href="/sign-in"
          prompt={t(($) => $["features/auth"].reset.prompt)}
        />
      </View>
    </AuthShell>
  );
}
