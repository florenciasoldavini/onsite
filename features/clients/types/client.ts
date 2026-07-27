export type ClientSort =
  | "created_asc"
  | "created_desc"
  | "name_asc"
  | "name_desc";

export interface Client {
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

export type ClientSummary = Pick<
  Client,
  "email" | "first_name" | "id" | "last_name" | "owner_id" | "phone_number"
>;

export interface ClientFilters {
  ownerId?: string;
  query?: string;
  sort?: ClientSort;
}

export interface ClientFormValues {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface CreateClientInput {
  email: string | null;
  first_name: string;
  last_name: string | null;
  phone_number: string | null;
}

export type UpdateClientInput = Partial<CreateClientInput>;
