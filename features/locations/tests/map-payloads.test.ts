import {
  mapAddressSuggestions,
  mapResolvedAddress,
  mapStaticMapPreview
} from "@/features/locations/maps/map-payloads";

describe("map payloads", () => {
  it("maps autocomplete suggestions defensively", () => {
    expect(
      mapAddressSuggestions({
        suggestions: [
          { placeId: "ignored" },
          { placeId: "place-1", text: "Main St" },
          null
        ]
      })
    ).toEqual([{ placeId: "place-1", text: "Main St" }]);
  });

  it("maps resolved address coordinates", () => {
    expect(
      mapResolvedAddress({
        address: "Main St",
        latitude: -34,
        longitude: -58,
        placeId: "place-1"
      })
    ).toEqual({
      address: "Main St",
      latitude: -34,
      longitude: -58,
      placeId: "place-1"
    });
  });

  it("maps static map preview image responses", () => {
    expect(
      mapStaticMapPreview({
        attribution: "Google Maps",
        imageDataUrl: "data:image/png;base64,abc"
      })
    ).toEqual({
      attribution: "Google Maps",
      imageDataUrl: "data:image/png;base64,abc"
    });
  });
});
