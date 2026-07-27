import { useLocationAddressField } from "@/features/locations/hooks/use-location-address";
import type { ResolvedAddress } from "@/features/locations/types/location";
import { AddressAutocompleteField } from "@/shared/ui/forms/address-autocomplete-field";

export function SupplierAddressField({
  errorText,
  onChange,
  value
}: {
  errorText?: string | null;
  onChange: (address: ResolvedAddress | null) => void;
  value: ResolvedAddress | null;
}) {
  const controller = useLocationAddressField({ onChange, value });

  return (
    <AddressAutocompleteField
      controller={controller}
      errorText={errorText}
      label="Address"
    />
  );
}
