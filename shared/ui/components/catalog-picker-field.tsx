import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import {
  findSelectedCatalogItem,
  getCatalogContactSummary,
  type CatalogContactItem
} from "@/shared/ui/components/catalog-picker-state";
import { SearchField } from "@/shared/ui/components/input";
import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import type { AppIconComponent } from "@/shared/ui/icons";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export function CatalogPickerField<TItem extends CatalogContactItem>({
  entityName,
  entityNamePlural,
  footer,
  getDisplayName,
  hasNextPage = false,
  icon: Icon,
  isError,
  isFetchingNextPage = false,
  isLoading,
  label,
  onChange,
  onLoadMore,
  onQueryChange,
  optional = true,
  pages,
  query,
  searchPlaceholder = "Search by name, phone, or email",
  selectedItemFallback,
  value
}: {
  entityName: string;
  entityNamePlural: string;
  footer?: ReactNode;
  getDisplayName: (item: TItem) => string;
  hasNextPage?: boolean;
  icon: AppIconComponent;
  isError: boolean;
  isFetchingNextPage?: boolean;
  isLoading: boolean;
  label: string;
  onChange: (id: string | null) => void;
  onLoadMore?: () => void;
  onQueryChange: (query: string) => void;
  optional?: boolean;
  pages?: readonly { items: readonly TItem[] }[];
  query: string;
  searchPlaceholder?: string;
  selectedItemFallback?: TItem | null;
  value: string | null;
}) {
  const items = useMemo(
    () => pages?.flatMap((page) => page.items) ?? [],
    [pages]
  );
  const selectedItem = findSelectedCatalogItem({
    fallback: selectedItemFallback,
    items,
    value
  });

  return (
    <View style={styles.root}>
      <View style={styles.labelRow}>
        <AppText variant="label">{label}</AppText>
        {optional ? (
          <AppText tone="subtle" variant="meta">
            (optional)
          </AppText>
        ) : null}
      </View>

      {selectedItem ? (
        <SelectedCatalogItem
          entityName={entityName}
          getDisplayName={getDisplayName}
          icon={Icon}
          item={selectedItem}
          onClear={() => onChange(null)}
        />
      ) : null}

      <SearchField
        onChangeText={onQueryChange}
        placeholder={searchPlaceholder}
        size="md"
        value={query}
      />

      <AppCard padding="sm" tone="muted">
        <View style={styles.options}>
          {isLoading ? (
            <AppText tone="muted">Loading {entityNamePlural}…</AppText>
          ) : isError ? (
            <AppText tone="danger">
              We couldn&apos;t load {entityNamePlural}. Try again.
            </AppText>
          ) : items.length === 0 ? (
            <AppText tone="muted">No matching {entityNamePlural}.</AppText>
          ) : (
            items.map((item) => {
              const displayName = getDisplayName(item);

              return (
                <Pressable
                  accessibilityLabel={`Select ${displayName}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: value === item.id }}
                  key={item.id}
                  onPress={() => onChange(item.id)}
                  style={({ pressed }) => [
                    styles.option,
                    value === item.id ? styles.optionSelected : null,
                    pressed ? styles.optionPressed : null
                  ]}
                >
                  <AppText variant="label">{displayName}</AppText>
                  {item.phone_number || item.email ? (
                    <AppText tone="muted" variant="bodySm">
                      {getCatalogContactSummary(item)}
                    </AppText>
                  ) : null}
                </Pressable>
              );
            })
          )}

          {hasNextPage && onLoadMore ? (
            <AppButton
              color="neutral"
              loading={isFetchingNextPage}
              onPress={onLoadMore}
              size="sm"
              variant="ghost"
            >
              Load more {entityNamePlural}
            </AppButton>
          ) : null}
        </View>
      </AppCard>

      {footer}
    </View>
  );
}

function SelectedCatalogItem<TItem extends CatalogContactItem>({
  entityName,
  getDisplayName,
  icon: Icon,
  item,
  onClear
}: {
  entityName: string;
  getDisplayName: (item: TItem) => string;
  icon: AppIconComponent;
  item: TItem;
  onClear: () => void;
}) {
  return (
    <AppCard padding="sm">
      <View style={styles.selected}>
        <Icon color={atomPalette.accent} size="md" />
        <View style={styles.selectedCopy}>
          <AppText variant="label">{getDisplayName(item)}</AppText>
          <AppText tone="muted" variant="bodySm">
            {getCatalogContactSummary(item)}
          </AppText>
        </View>
        <AppButton
          accessibilityLabel={`Clear selected ${entityName}`}
          color="neutral"
          fullWidth={false}
          onPress={onClear}
          size="sm"
          variant="ghost"
        >
          Clear
        </AppButton>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  option: {
    backgroundColor: atomPalette.surface,
    borderRadius: atomRadii.md,
    padding: atomSpacing[3]
  },
  optionPressed: {
    opacity: 0.78
  },
  optionSelected: {
    backgroundColor: `${atomPalette.accent}12`
  },
  options: {
    gap: atomSpacing[2]
  },
  root: {
    gap: atomSpacing[3]
  },
  selected: {
    alignItems: "center",
    flexDirection: "row",
    gap: atomSpacing[3]
  },
  selectedCopy: {
    flex: 1
  }
});
