import type { TradeCategory } from "@/features/trade-categories/types/trade-category";
import {
  requireSupabase,
  toRepositoryError
} from "@/infrastructure/supabase/repository";
import {
  getOffsetPageRange,
  toPaginatedResult,
  type OffsetPageRequest
} from "@/shared/utils/pagination";

const TRADE_CATEGORY_COLUMNS = [
  "code",
  "created_at",
  "deleted_at",
  "id",
  "updated_at"
].join(",");

export async function listTradeCategoryRows({
  offset,
  pageSize
}: OffsetPageRequest) {
  const client = requireSupabase();
  const range = getOffsetPageRange({ offset, pageSize });
  const { data, error } = await client
    .from("trade_categories")
    .select(TRADE_CATEGORY_COLUMNS)
    .is("deleted_at", null)
    .order("code", { ascending: true })
    .range(range.from, range.to);

  if (error) {
    throw toRepositoryError(error);
  }

  return toPaginatedResult((data ?? []) as unknown as TradeCategory[], range);
}
