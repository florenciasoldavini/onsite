import type {
  OwnedPersonContactRecord,
  PersonContactFormValues,
  PersonContactInput,
  PersonContactSummary
} from "@/shared/types/contact";

export type ClientSort =
  | "created_asc"
  | "created_desc"
  | "name_asc"
  | "name_desc";

export type Client = OwnedPersonContactRecord;

export type ClientSummary = PersonContactSummary;

export interface ClientFilters {
  ownerId?: string;
  query?: string;
  sort?: ClientSort;
}

export type ClientFormValues = PersonContactFormValues;

export type CreateClientInput = PersonContactInput;

export type UpdateClientInput = Partial<CreateClientInput>;
