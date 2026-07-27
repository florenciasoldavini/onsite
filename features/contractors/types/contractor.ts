export type ContractorSort =
  | "created_asc"
  | "created_desc"
  | "name_asc"
  | "name_desc";

export interface Contractor {
  created_at: string;
  deleted_at: string | null;
  email: string | null;
  first_name: string;
  id: string;
  last_name: string | null;
  owner_id: string;
  phone_number: string | null;
  updated_at: string | null;
}

export type ContractorSummary = Pick<
  Contractor,
  "email" | "first_name" | "id" | "last_name" | "owner_id" | "phone_number"
>;

export interface ContractorFilters {
  query?: string;
  sort?: ContractorSort;
}

export interface ContractorFormValues {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface CreateContractorInput {
  email: string | null;
  first_name: string;
  last_name: string | null;
  phone_number: string | null;
}

export type UpdateContractorInput = Partial<CreateContractorInput>;
