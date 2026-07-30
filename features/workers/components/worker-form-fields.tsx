import { ContractorPickerField } from "@/features/contractors/components/contractor-picker-field";
import { getTradeCategoryLabel } from "@/features/trade-categories/constants/trade-category-labels";
import { useTradeCategories } from "@/features/trade-categories/hooks/use-trade-categories";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import type { WorkerFormValues } from "@/features/workers/types/worker";
import { AppButton } from "@/shared/ui/components/button";
import { TextField } from "@/shared/ui/components/input";
import { MultiSelectField } from "@/shared/ui/components/multi-select-field";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import { Controller, type Control } from "react-hook-form";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

export function WorkerFormFields({
  control,
  onChange,
  ownerId
}: {
  control: Control<WorkerFormValues>;
  onChange?: () => void;
  ownerId?: string;
}) {
  const { t } = useTranslation("features/workers");
  const { language } = useLocalization();
  const { t: tShared } = useTranslation("shared");
  const tradeCategoriesQuery = useTradeCategories();
  const tradeCategories =
    tradeCategoriesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={{ gap: atomSpacing[5] }}>
      <Controller
        control={control}
        name="first_name"
        render={({ field, fieldState }) => (
          <TextField
            autoCapitalize="words"
            errorText={fieldState.error?.message}
            label={t(($) => $["features/workers"].fields.firstName)}
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
            label={t(($) => $["features/workers"].fields.lastName)}
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
            label={t(($) => $["features/workers"].fields.phone)}
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
            label={t(($) => $["features/workers"].fields.email)}
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
      <Controller
        control={control}
        name="contractor_id"
        render={({ field }) => (
          <ContractorPickerField
            onChange={(value) => {
              field.onChange(value);
              onChange?.();
            }}
            ownerId={ownerId}
            value={field.value}
          />
        )}
      />
      {tradeCategoriesQuery.isLoading ? (
        <AppText tone="muted">
          {t(($) => $["features/workers"].fields.loadingTrades)}
        </AppText>
      ) : tradeCategoriesQuery.isError ? (
        <View style={{ gap: atomSpacing[2] }}>
          <AppText tone="danger">
            {t(($) => $["features/workers"].fields.tradeLoadError)}
          </AppText>
          <AppButton
            color="neutral"
            fullWidth={false}
            onPress={() => void tradeCategoriesQuery.refetch()}
            size="sm"
            variant="bordered"
          >
            {tShared(($) => $.shared.actions.retry)}
          </AppButton>
        </View>
      ) : (
        <Controller
          control={control}
          name="trade_category_ids"
          render={({ field, fieldState }) => (
            <View style={{ gap: atomSpacing[2] }}>
              <MultiSelectField
                errorText={fieldState.error?.message}
                helperText={t(
                  ($) => $["features/workers"].fields.tradeHelper
                )}
                label={t(
                  ($) => $["features/workers"].fields.tradeCategories
                )}
                onChange={(value) => {
                  field.onChange(value);
                  onChange?.();
                }}
                options={tradeCategories.map((category) => ({
                  label: getTradeCategoryLabel(category.code, language),
                  value: category.id
                }))}
                value={field.value}
              />
              {tradeCategoriesQuery.hasNextPage ? (
                <AppButton
                  color="neutral"
                  fullWidth={false}
                  loading={tradeCategoriesQuery.isFetchingNextPage}
                  onPress={() => void tradeCategoriesQuery.fetchNextPage()}
                  size="sm"
                  variant="ghost"
                >
                  {t(($) => $["features/workers"].fields.loadMoreTrades)}
                </AppButton>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}
