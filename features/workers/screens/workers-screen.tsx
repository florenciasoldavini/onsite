import { useContractors } from "@/features/contractors/hooks/use-contractors";
import { getContractorDisplayName } from "@/features/contractors/schemas/contractor.schema";
import { getTradeCategoryLabel } from "@/features/trade-categories/constants/trade-category-labels";
import { useTradeCategories } from "@/features/trade-categories/hooks/use-trade-categories";
import { WorkerCard } from "@/features/workers/components/worker-card";
import { useWorkers } from "@/features/workers/hooks/use-workers";
import type {
  WorkerSort,
  WorkerSummary
} from "@/features/workers/types/worker";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppButton } from "@/shared/ui/components/button";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { SearchField } from "@/shared/ui/components/input";
import { MultiSelectField } from "@/shared/ui/components/multi-select-field";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { Screen } from "@/shared/ui/components/screen";
import { SelectMenu } from "@/shared/ui/components/select-menu";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { atomSpacing } from "@/shared/ui/components/theme";
import { PlusIcon, RefreshIcon, SortIcon, UserIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { FlatList, View, type ListRenderItemInfo } from "react-native";

const workerSortOptions = [
  { label: "Newest", value: "created_desc" },
  { label: "Oldest", value: "created_asc" },
  { label: "A-Z", value: "name_asc" },
  { label: "Z-A", value: "name_desc" }
] satisfies { label: string; value: WorkerSort }[];

export default function WorkersScreen({
  directoryHeader
}: {
  directoryHeader?: ReactNode;
}) {
  const router = useRouter();
  const { isCompact, isExpanded } = useLayoutMode();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<WorkerSort>("created_desc");
  const [contractorId, setContractorId] = useState("all");
  const [tradeCategoryIds, setTradeCategoryIds] = useState<string[]>([]);
  const workersQuery = useWorkers({
    contractorId: contractorId === "all" ? null : contractorId,
    query,
    sort,
    tradeCategoryIds
  });
  const contractorsQuery = useContractors({ sort: "name_asc" });
  const tradeCategoriesQuery = useTradeCategories();
  const workers = useMemo(
    () => workersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [workersQuery.data]
  );
  const contractors = useMemo(
    () => contractorsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [contractorsQuery.data]
  );
  const tradeCategories = useMemo(
    () => tradeCategoriesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [tradeCategoriesQuery.data]
  );
  const columns = isExpanded ? 3 : isCompact ? 1 : 2;
  const openWorker = useCallback(
    (workerId: string) => router.push(`/workers/${workerId}` as never),
    [router]
  );
  const renderWorker = useCallback(
    ({ item }: ListRenderItemInfo<WorkerSummary>) => (
      <View
        style={{
          flex: 1 / columns,
          maxWidth: `${100 / columns}%`,
          padding: atomSpacing[2]
        }}
      >
        <WorkerCard onPress={() => openWorker(item.id)} worker={item} />
      </View>
    ),
    [columns, openWorker]
  );
  const loadMore = useCallback(() => {
    if (workersQuery.hasNextPage && !workersQuery.isFetchingNextPage) {
      void workersQuery.fetchNextPage();
    }
  }, [workersQuery]);
  const hasFilters =
    query.trim().length > 0 ||
    contractorId !== "all" ||
    tradeCategoryIds.length > 0;

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
                onPress={() => router.push("/workers/new" as never)}
                size="sm"
              >
                New worker
              </AppButton>
            ) : null
          }
          description="Manage worker contacts, contractors, and usual trades."
          title="Workers"
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
            placeholder="Search workers"
            value={query}
          />
        </View>
        <SelectMenu
          accessibilityLabel="Filter workers by contractor"
          labelPrefix="Contractor"
          onChange={setContractorId}
          options={[
            { label: "All", value: "all" },
            ...contractors.map((contractor) => ({
              label: getContractorDisplayName(contractor),
              value: contractor.id
            }))
          ]}
          value={contractorId}
        />
        <SelectMenu
          accessibilityLabel="Sort workers"
          icon={SortIcon}
          labelPrefix="Sort"
          onChange={setSort}
          options={workerSortOptions}
          value={sort}
        />
      </View>
      {contractorsQuery.hasNextPage ? (
        <AppButton
          color="neutral"
          fullWidth={false}
          loading={contractorsQuery.isFetchingNextPage}
          onPress={() => void contractorsQuery.fetchNextPage()}
          size="sm"
          variant="ghost"
        >
          Load more contractor filters
        </AppButton>
      ) : null}
      {tradeCategories.length > 0 ? (
        <MultiSelectField
          helperText="Workers matching any selected trade will be shown."
          label="Filter by trade"
          onChange={setTradeCategoryIds}
          options={tradeCategories.map((category) => ({
            label: getTradeCategoryLabel(category.code),
            value: category.id
          }))}
          value={tradeCategoryIds}
        />
      ) : null}
      {tradeCategoriesQuery.hasNextPage ? (
        <AppButton
          color="neutral"
          fullWidth={false}
          loading={tradeCategoriesQuery.isFetchingNextPage}
          onPress={() => void tradeCategoriesQuery.fetchNextPage()}
          size="sm"
          variant="ghost"
        >
          Load more trade filters
        </AppButton>
      ) : null}
    </View>
  );

  const clearFilters = () => {
    setQuery("");
    setContractorId("all");
    setTradeCategoryIds([]);
  };

  const empty = workersQuery.isLoading ? (
    <View style={{ gap: atomSpacing[4], padding: atomSpacing[2] }}>
      {[0, 1, 2].map((item) => (
        <SkeletonBlock height={176} key={item} />
      ))}
    </View>
  ) : workersQuery.isError ? (
    <EmptyState
      action={{
        icon: RefreshIcon,
        label: "Retry",
        onPress: () => void workersQuery.refetch()
      }}
      description={getUserFacingErrorMessage(
        workersQuery.error,
        "We couldn't load your workers. Check your connection and try again."
      )}
      icon={UserIcon}
      title="Workers unavailable"
    />
  ) : (
    <EmptyState
      action={
        hasFilters
          ? { label: "Clear filters", onPress: clearFilters }
          : {
              icon: PlusIcon,
              label: "New worker",
              onPress: () => router.push("/workers/new" as never)
            }
      }
      description={
        hasFilters
          ? "Try another name, contractor, or trade category."
          : "Add your first worker to start building your directory."
      }
      icon={UserIcon}
      title={hasFilters ? "No matching workers" : "No workers yet"}
    />
  );

  return (
    <Screen
      floatingAction={
        workers.length > 0 && isCompact ? (
          <AppButton
            accessibilityLabel="New worker"
            icon={PlusIcon}
            layout="icon"
            onPress={() => router.push("/workers/new" as never)}
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
        data={workers}
        key={`workers-${columns}`}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={empty}
        ListFooterComponent={
          workersQuery.hasNextPage ? (
            <View style={{ padding: atomSpacing[4] }}>
              <AppButton
                color="neutral"
                loading={workersQuery.isFetchingNextPage}
                onPress={loadMore}
                size="sm"
                variant="bordered"
              >
                Load more workers
              </AppButton>
            </View>
          ) : null
        }
        ListHeaderComponent={header}
        numColumns={columns}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        renderItem={renderWorker}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
