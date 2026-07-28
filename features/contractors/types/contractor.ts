import type {
  OwnedPersonContactRecord,
  PersonContactFormValues,
  PersonContactInput,
  PersonContactSummary
} from "@/shared/types/contact";

export type ContractorSort =
  | "created_asc"
  | "created_desc"
  | "name_asc"
  | "name_desc";

export type Contractor = OwnedPersonContactRecord;

export type ContractorSummary = PersonContactSummary;

export interface ContractorFilters {
  ownerId?: string;
  query?: string;
  sort?: ContractorSort;
}

export type ContractorFormValues = PersonContactFormValues;

export type CreateContractorInput = PersonContactInput;

export type UpdateContractorInput = Partial<CreateContractorInput>;
