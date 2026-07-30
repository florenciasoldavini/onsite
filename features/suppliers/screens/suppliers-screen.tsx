import { SupplierCard } from "@/features/suppliers/components/supplier-card";
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers";
import type {
  SupplierSort,
  SupplierSummary
} from "@/features/suppliers/types/supplier";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppButton } from "@/shared/ui/components/button";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { InlineErrorState } from "@/shared/ui/components/inline-error-state";
import { SearchField } from "@/shared/ui/components/input";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { Screen } from "@/shared/ui/components/screen";
import { SelectMenu } from "@/shared/ui/components/select-menu";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { atomSpacing } from "@/shared/ui/components/theme";
import { PlusIcon, RefreshIcon, SortIcon, StoreIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View, type ListRenderItemInfo } from "react-native";

export default function SuppliersScreen({
  directoryHeader
}: {
  directoryHeader?: ReactNode;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/suppliers");
  const { t: tShared } = useTranslation("shared");
  const { isCompact, isExpanded } = useLayoutMode();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SupplierSort>("created_desc");
  const supplierSortOptions = useMemo(
    () =>
      [
        {
          label: t(($) => $["features/suppliers"].sort.newest),
          value: "created_desc"
        },
        {
          label: t(($) => $["features/suppliers"].sort.oldest),
          value: "created_asc"
        },
        {
          label: t(($) => $["features/suppliers"].sort.ascending),
          value: "name_asc"
        },
        {
          label: t(($) => $["features/suppliers"].sort.descending),
          value: "name_desc"
        }
      ] satisfies { label: string; value: SupplierSort }[],
    [t]
  );
  const suppliersQuery = useSuppliers({ query, sort });
  const suppliers = useMemo(
    () => suppliersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [suppliersQuery.data]
  );
  const columns = isExpanded ? 3 : isCompact ? 1 : 2;
  const openSupplier = useCallback(
    (supplierId: string) => router.push(`/suppliers/${supplierId}` as never),
    [router]
  );
  const renderSupplier = useCallback(
    ({ item }: ListRenderItemInfo<SupplierSummary>) => (
      <View
        style={{
          flex: 1 / columns,
          maxWidth: `${100 / columns}%`,
          padding: atomSpacing[2]
        }}
      >
        <SupplierCard onPress={() => openSupplier(item.id)} supplier={item} />
      </View>
    ),
    [columns, openSupplier]
  );
  const loadMore = useCallback(() => {
    if (suppliersQuery.hasNextPage && !suppliersQuery.isFetchingNextPage) {
      void suppliersQuery.fetchNextPage();
    }
  }, [suppliersQuery]);
  const hasSearch = query.trim().length > 0;

  const header = (
    <View style={{ gap: atomSpacing[6], paddingBottom: atomSpacing[4] }}>
      {directoryHeader ?? (
        <NavScreenHeader
          action={
            !isCompact ? (
              <AppButton
                fullWidth={false}
                icon={PlusIcon}
                iconAfter={false}
                onPress={() => router.push("/suppliers/new" as never)}
                size="sm"
              >
                {t(($) => $["features/suppliers"].actions.new)}
              </AppButton>
            ) : null
          }
          description={t(($) => $["features/suppliers"].list.description)}
          title={t(($) => $["features/suppliers"].list.title)}
        />
      )}
      <View
        style={{
          alignItems: isExpanded ? "center" : "stretch",
          flexDirection: isExpanded ? "row" : "column",
          gap: atomSpacing[3]
        }}
      >
        <View style={{ flex: 1 }}>
          <SearchField
            onChangeText={setQuery}
            placeholder={t(
              ($) => $["features/suppliers"].list.searchPlaceholder
            )}
            value={query}
          />
        </View>
        <SelectMenu
          accessibilityLabel={t(
            ($) => $["features/suppliers"].accessibility.sort
          )}
          icon={SortIcon}
          labelPrefix={t(($) => $["features/suppliers"].sort.label)}
          onChange={setSort}
          options={supplierSortOptions}
          value={sort}
        />
      </View>
    </View>
  );

  const empty = suppliersQuery.isLoading ? (
    <View style={{ gap: atomSpacing[4], padding: atomSpacing[2] }}>
      {[0, 1, 2].map((item) => (
        <SkeletonBlock height={168} key={item} />
      ))}
    </View>
  ) : suppliersQuery.isError ? (
    <InlineErrorState
      action={{
        icon: RefreshIcon,
        label: tShared(($) => $.shared.actions.retry),
        onPress: () => void suppliersQuery.refetch()
      }}
      description={getUserFacingErrorMessage(
        suppliersQuery.error,
        t(($) => $["features/suppliers"].errors.listLoad)
      )}
      icon={StoreIcon}
      title={t(($) => $["features/suppliers"].errors.listUnavailable)}
    />
  ) : (
    <EmptyState
      action={
        hasSearch
          ? {
              label: t(
                ($) => $["features/suppliers"].actions.clearSearch
              ),
              onPress: () => setQuery("")
            }
          : {
              icon: PlusIcon,
              label: t(($) => $["features/suppliers"].actions.new),
              onPress: () => router.push("/suppliers/new" as never)
            }
      }
      description={
        hasSearch
          ? t(($) => $["features/suppliers"].search.noMatchDescription)
          : t(($) => $["features/suppliers"].search.emptyDescription)
      }
      icon={StoreIcon}
      title={
        hasSearch
          ? t(($) => $["features/suppliers"].search.noMatchTitle)
          : t(($) => $["features/suppliers"].search.emptyTitle)
      }
    />
  );

  return (
    <Screen
      floatingAction={
        suppliers.length > 0 && isCompact ? (
          <AppButton
            accessibilityLabel={t(
              ($) => $["features/suppliers"].accessibility.newSupplier
            )}
            icon={PlusIcon}
            layout="icon"
            onPress={() => router.push("/suppliers/new" as never)}
            shape="pill"
          />
        ) : null
      }
      scrollable={false}
    >
      <FlatList
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: atomSpacing[10]
        }}
        contentInsetAdjustmentBehavior="automatic"
        data={suppliers}
        key={`suppliers-${columns}`}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={empty}
        ListFooterComponent={
          suppliersQuery.hasNextPage ? (
            <View style={{ padding: atomSpacing[4] }}>
              <AppButton
                color="neutral"
                loading={suppliersQuery.isFetchingNextPage}
                onPress={loadMore}
                size="sm"
                variant="bordered"
              >
                {t(($) => $["features/suppliers"].actions.loadMore)}
              </AppButton>
            </View>
          ) : null
        }
        ListHeaderComponent={header}
        numColumns={columns}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        renderItem={renderSupplier}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
