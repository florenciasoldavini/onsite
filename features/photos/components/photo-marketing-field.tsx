import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomSpacing
} from "@/shared/ui/components/theme";
import { FormField } from "@/shared/ui/forms";
import { Switch, View } from "react-native";

export function PhotoMarketingField({
  disabled = false,
  onChange,
  value
}: {
  disabled?: boolean;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <FormField
      helperText="Keeps the operational category while making this photo easy to find for future promotional use."
      label="Marketing"
    >
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          gap: atomSpacing[3],
          justifyContent: "space-between"
        }}
      >
        <AppText tone="muted" variant="bodySm">
          Mark for marketing
        </AppText>
        <Switch
          accessibilityLabel="Mark photo for marketing"
          disabled={disabled}
          onValueChange={onChange}
          thumbColor={atomPalette.surface}
          trackColor={{
            false: atomPalette.surfaceStrong,
            true: atomPalette.accent
          }}
          value={value}
        />
      </View>
    </FormField>
  );
}
