import { SupplierCard } from "@/features/suppliers/components/supplier-card";
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers";
import type {
  SupplierSort,
  SupplierSummary
} from "@/features/suppliers/types/supplier";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppButton } from "@/shared/ui/components/button";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { SearchField } from "@/shared/ui/components/input";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { Screen } from "@/shared/ui/components/screen";
import { SelectMenu } from "@/shared/ui/components/select-menu";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { atomSpacing } from "@/shared/ui/components/theme";
import {
  PlusIcon,
  RefreshIcon,
  SortIcon,
  StoreIcon
} from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { FlatList, View, type ListRenderItemInfo } from "react-native";

const supplierSortOptions = [
  { label: "Newest", value: "created_desc" },
  { label: "Oldest", value: "created_asc" },
  { label: "A-Z", value: "name_asc" },
  { label: "Z-A", value: "name_desc" }
] satisfies { label: string; value: SupplierSort }[];

export default function SuppliersScreen({
  directoryHeader
}: {
  directoryHeader?: ReactNode;
}) {
  const router = useRouter();
  const { isCompact, isExpanded } = useLayoutMode();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SupplierSort>("created_desc");
  const suppliersQuery = useSuppliers({ query, sort });
  const suppliers = useMemo(
    () => suppliersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [suppliersQuery.data]
  );
  const columns = isExpanded ? 3 : isCompact ? 1 : 2;
  const openSupplier = useCallback(
    (supplierId: string) =>
      router.push(`/suppliers/${supplierId}` as never),
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
        <SupplierCard
          onPress={() => openSupplier(item.id)}
          supplier={item}
        />
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
                New supplier
              </AppButton>
            ) : null
          }
          description="Keep supplier contact and location details ready for your projects."
          title="Suppliers"
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
            placeholder="Search suppliers"
            value={query}
          />
        </View>
        <SelectMenu
          accessibilityLabel="Sort suppliers"
          icon={SortIcon}
          labelPrefix="Sort"
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
    <EmptyState
      action={{
        icon: RefreshIcon,
        label: "Retry",
        onPress: () => void suppliersQuery.refetch()
      }}
      description={getUserFacingErrorMessage(
        suppliersQuery.error,
        "We couldn't load your suppliers. Check your connection and try again."
      )}
      icon={StoreIcon}
      title="Suppliers unavailable"
    />
  ) : (
    <EmptyState
      action={
        hasSearch
          ? { label: "Clear search", onPress: () => setQuery("") }
          : {
              icon: PlusIcon,
              label: "New supplier",
              onPress: () => router.push("/suppliers/new" as never)
            }
      }
      description={
        hasSearch
          ? "Try another name, contact, website, or address."
          : "Add your first supplier to start building your directory."
      }
      icon={StoreIcon}
      title={hasSearch ? "No matching suppliers" : "No suppliers yet"}
    />
  );

  return (
    <Screen
      floatingAction={
        suppliers.length > 0 && isCompact ? (
          <AppButton
            accessibilityLabel="New supplier"
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
                Load more suppliers
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
