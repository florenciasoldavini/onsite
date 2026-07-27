import type {
  AddressSuggestion,
  ResolvedAddress,
  StaticMapPreview
} from "@/features/locations/types/location";

export function mapAddressSuggestions(payload: unknown): AddressSuggestion[] {
  if (!payload || typeof payload !== "object" || !("suggestions" in payload)) {
    return [];
  }

  const suggestions = (payload as { suggestions?: unknown }).suggestions;

  if (!Array.isArray(suggestions)) {
    return [];
  }

  return suggestions
    .map((suggestion) => {
      if (!suggestion || typeof suggestion !== "object") {
        return null;
      }

      const placeId = (suggestion as { placeId?: unknown }).placeId;
      const text = (suggestion as { text?: unknown }).text;

      return typeof placeId === "string" && typeof text === "string"
        ? { placeId, text }
        : null;
    })
    .filter((suggestion): suggestion is AddressSuggestion =>
      Boolean(suggestion)
    );
}

export function mapResolvedAddress(payload: unknown): ResolvedAddress {
  if (!payload || typeof payload !== "object") {
    throw new Error("Address lookup returned an invalid response.");
  }

  const address = (payload as { address?: unknown }).address;
  const latitude = (payload as { latitude?: unknown }).latitude;
  const longitude = (payload as { longitude?: unknown }).longitude;
  const placeId = (payload as { placeId?: unknown }).placeId;

  if (
    typeof address !== "string" ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    typeof placeId !== "string"
  ) {
    throw new Error("Address lookup returned incomplete coordinates.");
  }

  return { address, latitude, longitude, placeId };
}

export function mapStaticMapPreview(payload: unknown): StaticMapPreview {
  if (!payload || typeof payload !== "object") {
    throw new Error("Map preview returned an invalid response.");
  }

  const attribution = (payload as { attribution?: unknown }).attribution;
  const imageDataUrl = (payload as { imageDataUrl?: unknown }).imageDataUrl;

  if (
    typeof attribution !== "string" ||
    typeof imageDataUrl !== "string" ||
    !imageDataUrl.startsWith("data:image/")
  ) {
    throw new Error("Map preview returned an incomplete image.");
  }

  return { attribution, imageDataUrl };
}
