export interface PersonName {
  first_name: string;
  last_name: string | null;
}

export interface PersonContactDetails extends PersonName {
  email: string | null;
  phone_number: string | null;
}

export interface OwnedPersonContactRecord extends PersonContactDetails {
  created_at: string;
  deleted_at: string | null;
  id: string;
  owner_id: string;
  updated_at: string | null;
}

export type PersonContactSummary = Pick<
  OwnedPersonContactRecord,
  "email" | "first_name" | "id" | "last_name" | "owner_id" | "phone_number"
>;

export interface PersonContactFormValues {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface PersonContactInput {
  email: string | null;
  first_name: string;
  last_name: string | null;
  phone_number: string | null;
}
