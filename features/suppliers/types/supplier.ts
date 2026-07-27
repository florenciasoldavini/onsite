import type { ResolvedAddress } from "@/features/locations/types/location";

export type SupplierSort =
  | "created_asc"
  | "created_desc"
  | "name_asc"
  | "name_desc";

export interface Supplier {
  address: string | null;
  contact_name: string | null;
  created_at: string;
  deleted_at: string | null;
  email: string | null;
  google_place_id: string | null;
  id: string;
  latitude: number | null;
  longitude: number | null;
  name: string;
  notes: string | null;
  owner_id: string;
  phone_number: string | null;
  updated_at: string | null;
  website_url: string | null;
}

export type SupplierSummary = Pick<
  Supplier,
  | "address"
  | "contact_name"
  | "email"
  | "id"
  | "name"
  | "owner_id"
  | "phone_number"
  | "website_url"
>;

export interface SupplierFilters {
  ownerId?: string;
  query?: string;
  sort?: SupplierSort;
}

export interface SupplierFormValues {
  address: ResolvedAddress | null;
  contact_name: string;
  email: string;
  name: string;
  notes: string;
  phone_number: string;
  website_url: string;
}

export interface CreateSupplierInput {
  address: string | null;
  contact_name: string | null;
  email: string | null;
  google_place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  name: string;
  notes: string | null;
  phone_number: string | null;
  website_url: string | null;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;
