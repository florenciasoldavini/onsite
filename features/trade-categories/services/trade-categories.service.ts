import { listTradeCategoryRows } from "@/features/trade-categories/repositories/trade-categories.repository";
import type { TradeCategory } from "@/features/trade-categories/types/trade-category";
import type {
  OffsetPageRequest,
  PaginatedResult
} from "@/shared/utils/pagination";

export function listTradeCategories({
  offset,
  pageSize
}: OffsetPageRequest): Promise<PaginatedResult<TradeCategory>> {
  return listTradeCategoryRows({ offset, pageSize });
}
