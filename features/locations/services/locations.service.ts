import {
  autocompleteAddressRows,
  getStaticMapPreviewRow,
  resolveAddressRow
} from "@/features/locations/repositories/locations.repository";

export function autocompleteAddresses(input: {
  input: string;
  sessionToken: string;
}) {
  return autocompleteAddressRows(input);
}

export function resolveAddress(input: {
  placeId: string;
  sessionToken: string;
}) {
  return resolveAddressRow(input);
}

export function getLocationMapPreview(
  input: Parameters<typeof getStaticMapPreviewRow>[0]
) {
  return getStaticMapPreviewRow(input);
}
