import { toLiveUserLocation } from "@/features/projects/maps/live-user-location-values";

describe("live user location values", () => {
  it("normalizes Expo location coordinates for map markers", () => {
    expect(
      toLiveUserLocation({
        coords: {
          accuracy: 8,
          latitude: -34.5663,
          longitude: -58.469
        }
      })
    ).toEqual({
      accuracy: 8,
      latitude: -34.5663,
      longitude: -58.469
    });
  });
});
