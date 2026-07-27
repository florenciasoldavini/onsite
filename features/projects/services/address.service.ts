import {
  autocompleteAddresses,
  getLocationMapPreview,
  resolveAddress
} from "@/features/locations/services/locations.service";
import type {
  StaticMapPoint,
  StaticMapViewport
} from "@/features/projects/types/project.types";

export async function autocompleteProjectAddress({
  input,
  sessionToken
}: {
  input: string;
  sessionToken: string;
}) {
  return autocompleteAddresses({ input, sessionToken });
}

export async function resolveProjectAddress({
  placeId,
  sessionToken
}: {
  placeId: string;
  sessionToken: string;
}) {
  return resolveAddress({ placeId, sessionToken });
}

export async function getProjectAddressMapPreview({
  latitude,
  longitude
}: {
  latitude: number;
  longitude: number;
}) {
  return getLocationMapPreview({ latitude, longitude });
}

export async function getProjectsMapPreview({
  points,
  viewport
}: {
  points: StaticMapPoint[];
  viewport?: StaticMapViewport | null;
}) {
  return getLocationMapPreview({ points, viewport });
}
