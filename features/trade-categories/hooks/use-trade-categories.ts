import { useAuth } from "@/features/auth/hooks/use-auth";
import { listTradeCategories } from "@/features/trade-categories/services/trade-categories.service";
import type { TradeCategory } from "@/features/trade-categories/types/trade-category";
import {
  DEFAULT_PAGE_SIZE,
  type PaginatedResult
} from "@/shared/utils/pagination";
import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

const tradeCategoriesKey = ["trade-categories"] as const;

export function useTradeCategories() {
  const { user } = useAuth();

  return useInfiniteQuery<
    PaginatedResult<TradeCategory>,
    Error,
    InfiniteData<PaginatedResult<TradeCategory>>,
    readonly unknown[],
    number
  >({
    enabled: Boolean(user),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listTradeCategories({
        offset: pageParam,
        pageSize: DEFAULT_PAGE_SIZE
      }),
    queryKey: [...tradeCategoriesKey, user?.id],
    staleTime: 24 * 60 * 60_000
  });
}
