import { useLocationAddressField } from "@/features/locations/hooks/use-location-address";
import type { ResolvedAddress } from "@/features/locations/types/location";
import { AddressAutocompleteField } from "@/shared/ui/forms/address-autocomplete-field";
import { useTranslation } from "react-i18next";

export function ProjectAddressField({
  errorText,
  onChange,
  value
}: {
  errorText?: string | null;
  onChange: (address: ResolvedAddress | null) => void;
  value: ResolvedAddress | null;
}) {
  const { t } = useTranslation("features/projects");
  const controller = useLocationAddressField({ onChange, value });

  return (
    <AddressAutocompleteField
      controller={controller}
      errorText={errorText}
      label={t(($) => $["features/projects"].fields.address)}
      required
    />
  );
}
