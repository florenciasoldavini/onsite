import { useAuth } from "@/features/auth/hooks/use-auth";
import { useChangeProfilePassword } from "@/features/profile/hooks/use-profile-avatar";
import {
  createProfilePasswordSchema,
  type ProfilePasswordInput
} from "@/features/profile/schemas/profile.schemas";
import { getSupabaseErrorMessage } from "@/infrastructure/supabase/client";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { FieldMessage } from "@/shared/ui/components/field-message";
import {
  PasswordVisibilityToggle,
  TextField
} from "@/shared/ui/components/input";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import { LockIcon } from "@/shared/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

const passwordDefaults: ProfilePasswordInput = {
  confirmPassword: "",
  password: ""
};

export function ProfileSecurityTab() {
  const { i18n, t } = useTranslation("features/auth");
  const { t: tProfile } = useTranslation("features/profile");
  const profilePasswordSchema = useMemo(
    () => createProfilePasswordSchema(t),
    [i18n.resolvedLanguage, t]
  );
  const { session, user } = useAuth();
  const changePasswordMutation = useChangeProfilePassword();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const form = useForm<ProfilePasswordInput>({
    defaultValues: passwordDefaults,
    mode: "onChange",
    resolver: zodResolver(profilePasswordSchema)
  });
  const {
    control,
    formState: { isValid },
    handleSubmit,
    reset
  } = form;

  useEffect(() => {
    reset(passwordDefaults);
    setError(null);
    setStatus(null);
  }, [
    session?.user.email,
    user?.avatar,
    user?.email,
    user?.first_name,
    user?.last_name,
    user?.phone_number,
    reset
  ]);

  const clearMessages = () => {
    setError(null);
    setStatus(null);
  };

  const changePassword = handleSubmit(async ({ password }) => {
    clearMessages();

    try {
      await changePasswordMutation.mutateAsync(password);
      reset(passwordDefaults);
      setStatus(tProfile(($) => $["features/profile"].security.updated));
    } catch (mutationError) {
      setError(getSupabaseErrorMessage(mutationError));
    }
  });

  return (
    <AppCard padding="lg">
      <View style={styles.content}>
        <View style={styles.heading}>
          <AppText variant="label">
            {tProfile(($) => $["features/profile"].security.heading)}
          </AppText>
          <AppText tone="muted">
            {tProfile(($) => $["features/profile"].security.settings)}
          </AppText>
        </View>

        <View style={styles.fields}>
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
                    ? tProfile(
                        ($) => $["features/profile"].security.passwordHint
                      )
                    : null
                }
                label={tProfile(
                  ($) => $["features/profile"].security.newPassword
                )}
                leftIcon={LockIcon}
                onBlur={field.onBlur}
                onChangeText={(value) => {
                  field.onChange(value);
                  clearMessages();
                }}
                placeholder="new-password"
                required
                rightSlot={
                  <PasswordVisibilityToggle
                    onPress={() =>
                      setPasswordVisible((current) => !current)
                    }
                    visible={passwordVisible}
                  />
                }
                size="md"
                textContentType="newPassword"
                type={passwordVisible ? "text" : "password"}
                value={field.value}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <TextField
                autoCapitalize="none"
                autoComplete="new-password"
                errorText={fieldState.error?.message}
                label={tProfile(
                  ($) => $["features/profile"].security.confirm
                )}
                leftIcon={LockIcon}
                onBlur={field.onBlur}
                onChangeText={(value) => {
                  field.onChange(value);
                  clearMessages();
                }}
                placeholder="confirm-password"
                required
                rightSlot={
                  <PasswordVisibilityToggle
                    onPress={() =>
                      setConfirmPasswordVisible((current) => !current)
                    }
                    visible={confirmPasswordVisible}
                  />
                }
                size="md"
                textContentType="newPassword"
                type={confirmPasswordVisible ? "text" : "password"}
                value={field.value}
              />
            )}
          />

          <AppButton
            isDisabled={!isValid || changePasswordMutation.isPending}
            loading={changePasswordMutation.isPending}
            onPress={() => void changePassword()}
            size="md"
          >
            {tProfile(($) => $["features/profile"].security.change)}
          </AppButton>
        </View>

        {status ? <FieldMessage tone="success">{status}</FieldMessage> : null}
        {error ? <FieldMessage tone="error">{error}</FieldMessage> : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: atomSpacing[5]
  },
  fields: {
    gap: atomSpacing[3]
  },
  heading: {
    gap: atomSpacing[1]
  }
});
