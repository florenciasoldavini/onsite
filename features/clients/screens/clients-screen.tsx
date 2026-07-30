import { ClientCard } from "@/features/clients/components/client-card";
import { useClients } from "@/features/clients/hooks/use-clients";
import type {
  ClientSort,
  ClientSummary
} from "@/features/clients/types/client";
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
import { PlusIcon, RefreshIcon, SortIcon, UserIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View, type ListRenderItemInfo } from "react-native";

export default function ClientsScreen({
  directoryHeader
}: {
  directoryHeader?: ReactNode;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/clients");
  const { t: tShared } = useTranslation("shared");
  const { isCompact, isExpanded } = useLayoutMode();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ClientSort>("created_desc");
  const clientSortOptions = useMemo(
    () =>
      [
        {
          label: t(($) => $["features/clients"].sort.newest),
          value: "created_desc"
        },
        {
          label: t(($) => $["features/clients"].sort.oldest),
          value: "created_asc"
        },
        {
          label: t(($) => $["features/clients"].sort.ascending),
          value: "name_asc"
        },
        {
          label: t(($) => $["features/clients"].sort.descending),
          value: "name_desc"
        }
      ] satisfies { label: string; value: ClientSort }[],
    [t]
  );
  const clientsQuery = useClients({ query, sort });
  const clients = useMemo(
    () => clientsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [clientsQuery.data]
  );
  const columns = isExpanded ? 3 : isCompact ? 1 : 2;
  const openClient = useCallback(
    (clientId: string) => router.push(`/clients/${clientId}` as never),
    [router]
  );
  const renderClient = useCallback(
    ({ item }: ListRenderItemInfo<ClientSummary>) => (
      <View
        style={{
          flex: 1 / columns,
          maxWidth: `${100 / columns}%`,
          padding: atomSpacing[2]
        }}
      >
        <ClientCard client={item} onPress={() => openClient(item.id)} />
      </View>
    ),
    [columns, openClient]
  );
  const loadMore = useCallback(() => {
    if (clientsQuery.hasNextPage && !clientsQuery.isFetchingNextPage) {
      void clientsQuery.fetchNextPage();
    }
  }, [clientsQuery]);
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
                onPress={() => router.push("/clients/new" as never)}
                size="sm"
              >
                {t(($) => $["features/clients"].actions.new)}
              </AppButton>
            ) : null
          }
          description={t(($) => $["features/clients"].list.description)}
          title={t(($) => $["features/clients"].list.title)}
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
              ($) => $["features/clients"].list.searchPlaceholder
            )}
            value={query}
          />
        </View>
        <SelectMenu
          accessibilityLabel={t(
            ($) => $["features/clients"].accessibility.sort
          )}
          icon={SortIcon}
          labelPrefix={t(($) => $["features/clients"].sort.label)}
          onChange={setSort}
          options={clientSortOptions}
          value={sort}
        />
      </View>
    </View>
  );

  const empty = clientsQuery.isLoading ? (
    <View style={{ gap: atomSpacing[4], padding: atomSpacing[2] }}>
      {[0, 1, 2].map((item) => (
        <SkeletonBlock height={156} key={item} />
      ))}
    </View>
  ) : clientsQuery.isError ? (
    <InlineErrorState
      action={{
        icon: RefreshIcon,
        label: tShared(($) => $.shared.actions.retry),
        onPress: () => void clientsQuery.refetch()
      }}
      description={getUserFacingErrorMessage(
        clientsQuery.error,
        t(($) => $["features/clients"].errors.loadList)
      )}
      icon={UserIcon}
      title={t(($) => $["features/clients"].errors.listUnavailable)}
    />
  ) : (
    <EmptyState
      action={
        hasSearch
          ? {
              label: t(($) => $["features/clients"].actions.clearSearch),
              onPress: () => setQuery("")
            }
          : {
              icon: PlusIcon,
              label: t(($) => $["features/clients"].actions.new),
              onPress: () => router.push("/clients/new" as never)
            }
      }
      description={
        hasSearch
          ? t(($) => $["features/clients"].search.noMatchDescription)
          : t(($) => $["features/clients"].search.emptyDescription)
      }
      icon={UserIcon}
      title={
        hasSearch
          ? t(($) => $["features/clients"].search.noMatchTitle)
          : t(($) => $["features/clients"].search.emptyTitle)
      }
    />
  );

  return (
    <Screen
      floatingAction={
        clients.length > 0 && isCompact ? (
          <AppButton
            accessibilityLabel={t(
              ($) => $["features/clients"].accessibility.newClient
            )}
            icon={PlusIcon}
            layout="icon"
            onPress={() => router.push("/clients/new" as never)}
            shape="pill"
          />
        ) : null
      }
      scrollable={false}
    >
      <FlatList
        contentContainerStyle={{ flexGrow: 1, paddingBottom: atomSpacing[10] }}
        contentInsetAdjustmentBehavior="automatic"
        data={clients}
        key={`clients-${columns}`}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={empty}
        ListFooterComponent={
          clientsQuery.hasNextPage ? (
            <View style={{ padding: atomSpacing[4] }}>
              <AppButton
                color="neutral"
                loading={clientsQuery.isFetchingNextPage}
                onPress={loadMore}
                size="sm"
                variant="bordered"
              >
                {t(($) => $["features/clients"].actions.loadMore)}
              </AppButton>
            </View>
          ) : null
        }
        ListHeaderComponent={header}
        numColumns={columns}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        renderItem={renderClient}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
