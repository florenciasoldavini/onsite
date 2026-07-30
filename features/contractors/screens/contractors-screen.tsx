import { ContractorCard } from "@/features/contractors/components/contractor-card";
import { useContractors } from "@/features/contractors/hooks/use-contractors";
import type {
  ContractorSort,
  ContractorSummary
} from "@/features/contractors/types/contractor";
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
import {
  HardHatIcon,
  PlusIcon,
  RefreshIcon,
  SortIcon
} from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View, type ListRenderItemInfo } from "react-native";

export default function ContractorsScreen({
  directoryHeader
}: {
  directoryHeader?: ReactNode;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/contractors");
  const { t: tShared } = useTranslation("shared");
  const { isCompact, isExpanded } = useLayoutMode();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ContractorSort>("created_desc");
  const contractorSortOptions = useMemo(
    () =>
      [
        {
          label: t(($) => $["features/contractors"].sort.newest),
          value: "created_desc"
        },
        {
          label: t(($) => $["features/contractors"].sort.oldest),
          value: "created_asc"
        },
        {
          label: t(($) => $["features/contractors"].sort.ascending),
          value: "name_asc"
        },
        {
          label: t(($) => $["features/contractors"].sort.descending),
          value: "name_desc"
        }
      ] satisfies { label: string; value: ContractorSort }[],
    [t]
  );
  const contractorsQuery = useContractors({ query, sort });
  const contractors = useMemo(
    () => contractorsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [contractorsQuery.data]
  );
  const columns = isExpanded ? 3 : isCompact ? 1 : 2;
  const openContractor = useCallback(
    (contractorId: string) =>
      router.push(`/contractors/${contractorId}` as never),
    [router]
  );
  const renderContractor = useCallback(
    ({ item }: ListRenderItemInfo<ContractorSummary>) => (
      <View
        style={{
          flex: 1 / columns,
          maxWidth: `${100 / columns}%`,
          padding: atomSpacing[2]
        }}
      >
        <ContractorCard
          contractor={item}
          onPress={() => openContractor(item.id)}
        />
      </View>
    ),
    [columns, openContractor]
  );
  const loadMore = useCallback(() => {
    if (contractorsQuery.hasNextPage && !contractorsQuery.isFetchingNextPage) {
      void contractorsQuery.fetchNextPage();
    }
  }, [contractorsQuery]);
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
                onPress={() => router.push("/contractors/new" as never)}
                size="sm"
              >
                {t(($) => $["features/contractors"].actions.new)}
              </AppButton>
            ) : null
          }
          description={t(($) => $["features/contractors"].list.description)}
          title={t(($) => $["features/contractors"].list.title)}
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
              ($) => $["features/contractors"].list.searchPlaceholder
            )}
            value={query}
          />
        </View>
        <SelectMenu
          accessibilityLabel={t(
            ($) => $["features/contractors"].accessibility.sort
          )}
          icon={SortIcon}
          labelPrefix={t(($) => $["features/contractors"].sort.label)}
          onChange={setSort}
          options={contractorSortOptions}
          value={sort}
        />
      </View>
    </View>
  );

  const empty = contractorsQuery.isLoading ? (
    <View style={{ gap: atomSpacing[4], padding: atomSpacing[2] }}>
      {[0, 1, 2].map((item) => (
        <SkeletonBlock height={156} key={item} />
      ))}
    </View>
  ) : contractorsQuery.isError ? (
    <InlineErrorState
      action={{
        icon: RefreshIcon,
        label: tShared(($) => $.shared.actions.retry),
        onPress: () => void contractorsQuery.refetch()
      }}
      description={getUserFacingErrorMessage(
        contractorsQuery.error,
        t(($) => $["features/contractors"].errors.loadList)
      )}
      icon={HardHatIcon}
      title={t(($) => $["features/contractors"].errors.listUnavailable)}
    />
  ) : (
    <EmptyState
      action={
        hasSearch
          ? {
              label: t(($) => $["features/contractors"].actions.clearSearch),
              onPress: () => setQuery("")
            }
          : {
              icon: PlusIcon,
              label: t(($) => $["features/contractors"].actions.new),
              onPress: () => router.push("/contractors/new" as never)
            }
      }
      description={
        hasSearch
          ? t(($) => $["features/contractors"].search.noMatchDescription)
          : t(($) => $["features/contractors"].search.emptyDescription)
      }
      icon={HardHatIcon}
      title={
        hasSearch
          ? t(($) => $["features/contractors"].search.noMatchTitle)
          : t(($) => $["features/contractors"].search.emptyTitle)
      }
    />
  );

  return (
    <Screen
      floatingAction={
        contractors.length > 0 && isCompact ? (
          <AppButton
            accessibilityLabel={t(
              ($) => $["features/contractors"].accessibility.new
            )}
            icon={PlusIcon}
            layout="icon"
            onPress={() => router.push("/contractors/new" as never)}
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
        data={contractors}
        key={`contractors-${columns}`}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={empty}
        ListFooterComponent={
          contractorsQuery.hasNextPage ? (
            <View style={{ padding: atomSpacing[4] }}>
              <AppButton
                color="neutral"
                loading={contractorsQuery.isFetchingNextPage}
                onPress={loadMore}
                size="sm"
                variant="bordered"
              >
                {t(($) => $["features/contractors"].actions.loadMore)}
              </AppButton>
            </View>
          ) : null
        }
        ListHeaderComponent={header}
        numColumns={columns}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        renderItem={renderContractor}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
