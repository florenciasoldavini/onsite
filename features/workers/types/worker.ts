import type { ContractorSummary } from "@/features/contractors/types/contractor";
import type { TradeCategory } from "@/features/trade-categories/types/trade-category";

export type WorkerSort =
  | "created_asc"
  | "created_desc"
  | "name_asc"
  | "name_desc";

export interface Worker {
  contractor: ContractorSummary | null;
  contractor_id: string | null;
  created_at: string;
  deleted_at: string | null;
  email: string | null;
  first_name: string;
  id: string;
  last_name: string | null;
  owner_id: string;
  phone_number: string | null;
  trade_categories: TradeCategory[];
  updated_at: string | null;
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

export interface WorkerFormValues {
  contractor_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  trade_category_ids: string[];
}

export interface CreateWorkerInput {
  contractor_id: string | null;
  email: string | null;
  first_name: string;
  last_name: string | null;
  phone_number: string | null;
  trade_category_ids: string[];
}

export type UpdateWorkerInput = CreateWorkerInput;
