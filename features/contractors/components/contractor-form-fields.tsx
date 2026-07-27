import type { ContractorFormValues } from "@/features/contractors/types/contractor";
import { TextField } from "@/shared/ui/components/input";
import { atomSpacing } from "@/shared/ui/components/theme";
import { Controller, type Control } from "react-hook-form";
import { View } from "react-native";

export function ContractorFormFields({
  control,
  onChange
}: {
  control: Control<ContractorFormValues>;
  onChange?: () => void;
}) {
  return (
    <View style={{ gap: atomSpacing[5] }}>
      <Controller
        control={control}
        name="first_name"
        render={({ field, fieldState }) => (
          <TextField
            autoCapitalize="words"
            errorText={fieldState.error?.message}
            label="First name"
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            placeholder="Alex"
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
            label="Last name"
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            placeholder="Morgan"
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
            label="Phone number"
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
            label="Email"
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            placeholder="alex@example.com"
            value={field.value}
          />
        )}
      />
    </View>
  );
}
