import { TradeCategory } from "@/features/trade-categories/types/trade-category";
import { z } from "zod";

const databaseTimestampSchema = z.iso.datetime({
  local: true,
  offset: true
});

export const TradeCategorySchema: z.ZodType<TradeCategory> = z.object({
  id: z.uuid(),
  code: z.string().regex(/^[a-z][a-z0-9_]*$/),
  created_at: databaseTimestampSchema,
  updated_at: databaseTimestampSchema.nullable(),
  deleted_at: databaseTimestampSchema.nullable()
});
