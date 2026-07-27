import { SelectableChip } from "@/shared/ui/components/selectable-chip";
import { atomSpacing } from "@/shared/ui/components/theme";
import { FormField } from "@/shared/ui/forms";
import type { ReactNode } from "react";
import { View } from "react-native";

export interface SelectFieldOption<T extends string> {
  label: string;
  value: T;
}

export function SelectField<T extends string>({
  disabled = false,
  errorText,
  helperText,
  label,
  onChange,
  options,
  required = false,
  value
}: {
  disabled?: boolean;
  errorText?: string | null;
  helperText?: string | null;
  label: ReactNode;
  onChange: (value: T) => void;
  options: SelectFieldOption<T>[];
  required?: boolean;
  value: T;
}) {
  return (
    <FormField
      errorText={errorText}
      helperText={helperText}
      label={label}
      required={required}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: atomSpacing[2]
        }}
      >
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <SelectableChip
              disabled={disabled}
              key={option.value}
              onPress={() => {
                onChange(option.value);
              }}
              selected={isSelected}
              variant="bordered"
            >
              {option.label}
            </SelectableChip>
          );
        })}
      </View>
    </FormField>
  );
}
