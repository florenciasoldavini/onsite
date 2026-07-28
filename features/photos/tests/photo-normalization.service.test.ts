import {
  getContainedSize,
  parseExifRecord
} from "@/features/photos/services/photo-normalization.service";

jest.mock("expo-image-manipulator", () => ({
  ImageManipulator: {},
  SaveFormat: { JPEG: "jpeg" }
}));

jest.mock("exifr/dist/lite.esm.mjs", () => ({
  parse: jest.fn()
}));

describe("photo normalization service", () => {
  it("extracts capture time, GPS, and GPS accuracy from supplied EXIF", () => {
    expect(
      parseExifRecord({
        DateTimeOriginal: "2026:07:27 15:30:00Z",
        GPSHPositioningError: 12,
        GPSLatitude: -34.6037,
        GPSLongitude: -58.3816
      })
    ).toEqual({
      capturedAt: "2026-07-27T15:30:00.000Z",
      latitude: -34.6037,
      locationAccuracyMeters: 12,
      longitude: -58.3816
    });
  });

  it("keeps missing EXIF nullable and preserves orientation proportions", () => {
    expect(parseExifRecord()).toEqual({
      capturedAt: null,
      latitude: null,
      locationAccuracyMeters: null,
      longitude: null
    });
    expect(
      getContainedSize({ height: 4000, maxDimension: 3200, width: 3000 })
    ).toEqual({ height: 3200, width: 2400 });
    expect(
      getContainedSize({ height: 600, maxDimension: 640, width: 400 })
    ).toEqual({ height: 600, width: 400 });
  });
});
