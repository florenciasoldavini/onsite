import {
  getMapsFunctionErrorCode,
  LocationRepositoryError,
  type LocationErrorCode
} from "@/features/locations/maps/map-errors";
import {
  mapAddressSuggestions,
  mapResolvedAddress,
  mapStaticMapPreview
} from "@/features/locations/maps/map-payloads";
import type {
  AddressSuggestion,
  ResolvedAddress,
  StaticMapPoint,
  StaticMapPreview,
  StaticMapViewport
} from "@/features/locations/types/location";
import { requireSupabase } from "@/infrastructure/supabase/repository";

export async function autocompleteAddressRows({
  input,
  sessionToken
}: {
  input: string;
  sessionToken: string;
}): Promise<AddressSuggestion[]> {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("places-autocomplete", {
    body: { input, sessionToken }
  });

  if (error) {
    throw toMapsFunctionError(
      error,
      "addressSuggestions"
    );
  }

  return mapAddressSuggestions(data);
}

export async function resolveAddressRow({
  placeId,
  sessionToken
}: {
  placeId: string;
  sessionToken: string;
}): Promise<ResolvedAddress> {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("places-resolve", {
    body: { placeId, sessionToken }
  });

  if (error) {
    throw toMapsFunctionError(
      error,
      "addressResolve"
    );
  }

  return mapResolvedAddress(data);
}

export async function getStaticMapPreviewRow({
  latitude,
  longitude,
  points,
  viewport
}: {
  latitude?: number;
  longitude?: number;
  points?: StaticMapPoint[];
  viewport?: StaticMapViewport | null;
}): Promise<StaticMapPreview> {
  const client = requireSupabase();
  const mapCenter = points?.length ? getMapCenter(points) : null;
  const { data, error } = await client.functions.invoke("maps-static-preview", {
    body: points?.length
      ? {
          centerLatitude: viewport?.centerLatitude,
          centerLongitude: viewport?.centerLongitude,
          latitude: viewport?.centerLatitude ?? mapCenter?.latitude,
          longitude: viewport?.centerLongitude ?? mapCenter?.longitude,
          points,
          zoom: viewport?.zoom
        }
      : { latitude, longitude }
  });

  if (error) {
    throw toMapsFunctionError(
      error,
      "mapPreview"
    );
  }

  return mapStaticMapPreview(data);
}

function getMapCenter(points: StaticMapPoint[]) {
  const total = points.reduce(
    (sum, point) => ({
      latitude: sum.latitude + point.latitude,
      longitude: sum.longitude + point.longitude
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: total.latitude / points.length,
    longitude: total.longitude / points.length
  };
}

export function toMapsFunctionError(
  error: unknown,
  fallback: LocationErrorCode
) {
  return new LocationRepositoryError(
    getMapsFunctionErrorCode(error, fallback),
    error
  );
}
