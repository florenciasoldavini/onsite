import type { ClientFormValues } from "@/features/clients/types/client";
import { TextField } from "@/shared/ui/components/input";
import { atomSpacing } from "@/shared/ui/components/theme";
import { Controller, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export function ClientFormFields({
  control,
  onChange
}: {
  control: Control<ClientFormValues>;
  onChange?: () => void;
}) {
  const { t } = useTranslation("features/clients");

  return (
    <View style={{ gap: atomSpacing[5] }}>
      <Controller
        control={control}
        name="first_name"
        render={({ field, fieldState }) => (
          <TextField
            autoCapitalize="words"
            errorText={fieldState.error?.message}
            label={t(($) => $["features/clients"].fields.firstName)}
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            placeholder="Ada"
            required
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="last_name"
        render={({ field, fieldState }) => (
          <TextField
            autoCapitalize="words"
            errorText={fieldState.error?.message}
            label={t(($) => $["features/clients"].fields.lastName)}
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            placeholder="Lovelace"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="phone_number"
        render={({ field, fieldState }) => (
          <TextField
            errorText={fieldState.error?.message}
            keyboardType="phone-pad"
            label={t(($) => $["features/clients"].fields.phone)}
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            placeholder="+54 11 5555 0101"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            autoCapitalize="none"
            autoCorrect={false}
            errorText={fieldState.error?.message}
            keyboardType="email-address"
            label={t(($) => $["features/clients"].fields.email)}
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            placeholder="ada@example.com"
            value={field.value}
          />
        )}
      />
    </View>
  );
}
