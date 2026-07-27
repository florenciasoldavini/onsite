export interface AddressSuggestion {
  placeId: string;
  text: string;
}

export interface ResolvedAddress {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

export interface StaticMapPreview {
  attribution: string;
  imageDataUrl: string;
}

export interface StaticMapPoint {
  label?: string;
  latitude: number;
  longitude: number;
}

export interface StaticMapViewport {
  centerLatitude: number;
  centerLongitude: number;
  zoom: number;
}
