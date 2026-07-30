import { useLocalization } from "@/features/localization/hooks/use-localization";
import type { SupportedLanguage } from "@/features/localization/types/language";
import { SelectMenu } from "@/shared/ui/components/select-menu";
import { LanguagesIcon } from "@/shared/ui/icons";
import { useTranslation } from "react-i18next";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { changeLanguage, language } = useLocalization();
  const { t } = useTranslation("features/localization");
  const options = [
    {
      label: t(($) => $["features/localization"].language.spanish),
      value: "es"
    },
    {
      label: t(($) => $["features/localization"].language.english),
      value: "en"
    }
  ] satisfies { label: string; value: SupportedLanguage }[];
  const currentLabel =
    options.find((option) => option.value === language)?.label ?? language;

  return (
    <SelectMenu
      accessibilityLabel={t(
        ($) => $["features/localization"].language.accessibilityLabel,
        { language: currentLabel }
      )}
      icon={LanguagesIcon}
      labelPrefix={
        compact
          ? undefined
          : t(($) => $["features/localization"].language.label)
      }
      minWidth={compact ? 132 : 180}
      onChange={(value) => void changeLanguage(value)}
      options={options}
      value={language}
    />
  );
}
