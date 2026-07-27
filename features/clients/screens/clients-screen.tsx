import { ClientCard } from "@/features/clients/components/client-card";
import { useClients } from "@/features/clients/hooks/use-clients";
import type {
  ClientSort,
  ClientSummary
} from "@/features/clients/types/client";
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
  UserIcon
} from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, View, type ListRenderItemInfo } from "react-native";

const clientSortOptions = [
  { label: "Newest", value: "created_desc" },
  { label: "Oldest", value: "created_asc" },
  { label: "A-Z", value: "name_asc" },
  { label: "Z-A", value: "name_desc" }
] satisfies { label: string; value: ClientSort }[];

export default function ClientsScreen() {
  const router = useRouter();
  const { isCompact, isExpanded } = useLayoutMode();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ClientSort>("created_desc");
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
              New client
            </AppButton>
          ) : null
        }
        description="Keep client contact details connected to the right projects."
        title="Clients"
      />
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
            placeholder="Search clients"
            value={query}
          />
        </View>
        <SelectMenu
          accessibilityLabel="Sort clients"
          icon={SortIcon}
          labelPrefix="Sort"
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
    <EmptyState
      action={{
        icon: RefreshIcon,
        label: "Retry",
        onPress: () => void clientsQuery.refetch()
      }}
      description={getUserFacingErrorMessage(
        clientsQuery.error,
        "We couldn't load your clients. Check your connection and try again."
      )}
      icon={UserIcon}
      title="Clients unavailable"
    />
  ) : (
    <EmptyState
      action={
        hasSearch
          ? { label: "Clear search", onPress: () => setQuery("") }
          : {
              icon: PlusIcon,
              label: "New client",
              onPress: () => router.push("/clients/new" as never)
            }
      }
      description={
        hasSearch
          ? "Try another name, phone number, or email."
          : "Add your first client to connect their contact details to projects."
      }
      icon={UserIcon}
      title={hasSearch ? "No matching clients" : "No clients yet"}
    />
  );

  return (
    <Screen
      floatingAction={
        clients.length > 0 && isCompact ? (
          <AppButton
            accessibilityLabel="New client"
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
                Load more clients
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
