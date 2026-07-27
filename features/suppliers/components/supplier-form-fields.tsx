import { SupplierAddressField } from "@/features/suppliers/components/supplier-address-field";
import type { SupplierFormValues } from "@/features/suppliers/types/supplier";
import { TextField } from "@/shared/ui/components/input";
import { TextAreaField } from "@/shared/ui/components/textarea";
import { atomSpacing } from "@/shared/ui/components/theme";
import { Controller, type Control } from "react-hook-form";
import { View } from "react-native";

export function SupplierFormFields({
  control,
  onChange
}: {
  control: Control<SupplierFormValues>;
  onChange?: () => void;
}) {
  return (
    <View style={{ gap: atomSpacing[5] }}>
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            autoCapitalize="words"
            errorText={fieldState.error?.message}
            label="Supplier name"
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            placeholder="Patagonia Building Supply"
            required
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="contact_name"
        render={({ field, fieldState }) => (
          <TextField
            autoCapitalize="words"
            errorText={fieldState.error?.message}
            label="Contact name"
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            placeholder="Alex Morgan"
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
            placeholder="sales@example.com"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="website_url"
        render={({ field, fieldState }) => (
          <TextField
            autoCapitalize="none"
            autoCorrect={false}
            errorText={fieldState.error?.message}
            keyboardType="url"
            label="Website"
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            placeholder="supplier.com"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="address"
        render={({ field, fieldState }) => (
          <SupplierAddressField
            errorText={fieldState.error?.message}
            onChange={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field, fieldState }) => (
          <TextAreaField
            errorText={fieldState.error?.message}
            label="Notes"
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            placeholder="Delivery details, preferred products, or other useful context"
            value={field.value}
          />
        )}
      />
    </View>
  );
}
