import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomSpacing
} from "@/shared/ui/components/theme";
import { FormField } from "@/shared/ui/forms";
import { Switch, View } from "react-native";
import { useTranslation } from "react-i18next";

export function PhotoMarketingField({
  disabled = false,
  onChange,
  value
}: {
  disabled?: boolean;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  const { t } = useTranslation("features/photos");
  return (
    <FormField
      helperText={t(($) => $["features/photos"].marketing.helper)}
      label={t(($) => $["features/photos"].marketing.label)}
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
          {t(($) => $["features/photos"].marketing.mark)}
        </AppText>
        <Switch
          accessibilityLabel={t(
            ($) => $["features/photos"].accessibility.markMarketing
          )}
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
