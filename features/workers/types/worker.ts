import type { ContractorSummary } from "@/features/contractors/types/contractor";
import type { TradeCategory } from "@/features/trade-categories/types/trade-category";
import type {
  OwnedPersonContactRecord,
  PersonContactFormValues,
  PersonContactInput
} from "@/shared/types/contact";

export type WorkerSort =
  | "created_asc"
  | "created_desc"
  | "name_asc"
  | "name_desc";

export interface Worker extends OwnedPersonContactRecord {
  contractor: ContractorSummary | null;
  contractor_id: string | null;
  trade_categories: TradeCategory[];
}

export type WorkerSummary = Pick<
  Worker,
  | "contractor"
  | "contractor_id"
  | "email"
  | "first_name"
  | "id"
  | "last_name"
  | "owner_id"
  | "phone_number"
  | "trade_categories"
>;

export interface WorkerFilters {
  contractorId?: string | null;
  query?: string;
  sort?: WorkerSort;
  tradeCategoryIds?: string[];
}

export interface WorkerFormValues extends PersonContactFormValues {
  contractor_id: string | null;
  trade_category_ids: string[];
}

export interface CreateWorkerInput extends PersonContactInput {
  contractor_id: string | null;
  trade_category_ids: string[];
}

export type UpdateWorkerInput = CreateWorkerInput;
