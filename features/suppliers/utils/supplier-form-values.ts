import type {
  Supplier,
  SupplierFormValues
} from "@/features/suppliers/types/supplier";

export function getSupplierFormValues(supplier: Supplier): SupplierFormValues {
  const hasAddress =
    supplier.address &&
    supplier.google_place_id &&
    supplier.latitude !== null &&
    supplier.longitude !== null;

  return {
    address: hasAddress
      ? {
          address: supplier.address!,
          latitude: supplier.latitude!,
          longitude: supplier.longitude!,
          placeId: supplier.google_place_id!
        }
      : null,
    contact_name: supplier.contact_name ?? "",
    email: supplier.email ?? "",
    name: supplier.name,
    notes: supplier.notes ?? "",
    phone_number: supplier.phone_number ?? "",
    website_url: supplier.website_url ?? ""
  };
}
