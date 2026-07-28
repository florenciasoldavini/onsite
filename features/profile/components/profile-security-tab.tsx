import { useAuth } from "@/features/auth/hooks/use-auth";
import { useChangeProfilePassword } from "@/features/profile/hooks/use-profile-avatar";
import {
  profilePasswordSchema,
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
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

const passwordDefaults: ProfilePasswordInput = {
  confirmPassword: "",
  password: ""
};

export function ProfileSecurityTab() {
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
      setStatus("Password updated.");
    } catch (mutationError) {
      setError(getSupabaseErrorMessage(mutationError));
    }
  });

  return (
    <AppCard padding="lg">
      <View style={styles.content}>
        <View style={styles.heading}>
          <AppText variant="label">Account Security</AppText>
          <AppText tone="muted">Password settings</AppText>
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
                    ? "Use 8+ chars with uppercase, number, and symbol."
                    : null
                }
                label="New Password"
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
                label="Confirm Password"
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
            Change Password
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
