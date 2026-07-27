import {
  PROJECT_PHOTO_FULL_MAX_DIMENSION,
  PROJECT_PHOTO_MAX_BYTES,
  PROJECT_PHOTO_THUMBNAIL_MAX_DIMENSION
} from "@/features/photos/constants/photo.constants";
import type {
  NormalizedProjectPhotoAsset,
  ProjectPhotoAsset
} from "@/features/photos/types/photo";
import { convertHeicForPlatform } from "@/features/photos/services/photo-heic-conversion";
import { UserFacingError } from "@/shared/utils/user-facing-errors";
import {
  ImageManipulator,
  SaveFormat
} from "expo-image-manipulator";
import * as exifr from "exifr/dist/lite.esm.mjs";

const FULL_VARIANTS = [
  { compress: 0.84, maxDimension: PROJECT_PHOTO_FULL_MAX_DIMENSION },
  { compress: 0.76, maxDimension: 3000 },
  { compress: 0.68, maxDimension: 2700 },
  { compress: 0.6, maxDimension: 2400 },
  { compress: 0.54, maxDimension: 2000 }
] as const;

export async function normalizeProjectPhotoAsset(
  asset: ProjectPhotoAsset
): Promise<NormalizedProjectPhotoAsset> {
  const sourceBlob =
    asset.file ?? (await (await fetch(asset.uri)).blob());
  const metadata = await extractPhotoMetadata(asset, sourceBlob);
  const convertedSource = await convertHeicForPlatform(asset, sourceBlob);

  try {
    const full = await createFullVariant({
      height: asset.height,
      sourceUri: convertedSource.uri,
      width: asset.width
    });
    const thumbnail = await createJpegVariant({
      compress: 0.72,
      height: full.height,
      maxDimension: PROJECT_PHOTO_THUMBNAIL_MAX_DIMENSION,
      sourceUri: full.uri,
      width: full.width
    });

    return {
      capturedAt: metadata.capturedAt,
      fileSizeBytes: full.size,
      fullUri: full.uri,
      height: full.height,
      latitude: metadata.latitude,
      locationAccuracyMeters: metadata.locationAccuracyMeters,
      locationSource:
        metadata.latitude === null ? null : "photo_exif",
      longitude: metadata.longitude,
      thumbnailUri: thumbnail.uri,
      width: full.width
    };
  } catch (error) {
    if (error instanceof UserFacingError) {
      throw error;
    }

    throw new UserFacingError(
      "We couldn't prepare this photo. Choose a different image and try again.",
      error
    );
  } finally {
    convertedSource.revoke?.();
  }
}

async function createFullVariant({
  height,
  sourceUri,
  width
}: {
  height: number;
  sourceUri: string;
  width: number;
}) {
  for (const variant of FULL_VARIANTS) {
    const result = await createJpegVariant({
      ...variant,
      height,
      sourceUri,
      width
    });

    if (result.size <= PROJECT_PHOTO_MAX_BYTES) {
      return result;
    }
  }

  throw new UserFacingError(
    "This photo is too large to prepare safely. Choose a smaller image and try again."
  );
}

async function createJpegVariant({
  compress,
  height,
  maxDimension,
  sourceUri,
  width
}: {
  compress: number;
  height: number;
  maxDimension: number;
  sourceUri: string;
  width: number;
}) {
  const resized = getContainedSize({ height, maxDimension, width });
  const context = ImageManipulator.manipulate(sourceUri);

  if (resized.width !== width || resized.height !== height) {
    context.resize({
      height: resized.height,
      width: resized.width
    });
  }

  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    compress,
    format: SaveFormat.JPEG
  });
  const blob = await (await fetch(saved.uri)).blob();

  return {
    height: saved.height,
    size: blob.size,
    uri: saved.uri,
    width: saved.width
  };
}

export function getContainedSize({
  height,
  maxDimension,
  width
}: {
  height: number;
  maxDimension: number;
  width: number;
}) {
  const longestSide = Math.max(height, width);

  if (longestSide <= maxDimension) {
    return { height, width };
  }

  const ratio = maxDimension / longestSide;

  return {
    height: Math.max(1, Math.round(height * ratio)),
    width: Math.max(1, Math.round(width * ratio))
  };
}

async function extractPhotoMetadata(asset: ProjectPhotoAsset, blob: Blob) {
  const provided = parseExifRecord(asset.exif);

  try {
    const exifInput = await blob.arrayBuffer();
    const [parsed, gps, orientation] = await Promise.all([
      exifr
        .parse(exifInput, [
          "DateTimeOriginal",
          "GPSHPositioningError"
        ])
        .catch(() => null),
      exifr.gps(exifInput).catch(() => null),
      exifr.orientation(exifInput).catch(() => undefined)
    ]);
    void orientation;
    const parsedRecord =
      parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : null;

    return {
      capturedAt:
        provided.capturedAt ??
        parseExifDate(parsedRecord?.DateTimeOriginal) ??
        new Date().toISOString(),
      latitude:
        provided.latitude ??
        toFiniteNumber(gps?.latitude),
      locationAccuracyMeters:
        provided.locationAccuracyMeters ??
        toPositiveNumber(parsedRecord?.GPSHPositioningError),
      longitude:
        provided.longitude ??
        toFiniteNumber(gps?.longitude)
    };
  } catch {
    return {
      capturedAt: provided.capturedAt ?? new Date().toISOString(),
      latitude: provided.latitude,
      locationAccuracyMeters: provided.locationAccuracyMeters,
      longitude: provided.longitude
    };
  }
}

export function parseExifRecord(exif?: Record<string, unknown> | null) {
  const latitude = toFiniteNumber(
    exif?.GPSLatitude ?? exif?.latitude
  );
  const longitude = toFiniteNumber(
    exif?.GPSLongitude ?? exif?.longitude
  );

  return {
    capturedAt:
      parseExifDate(exif?.DateTimeOriginal) ??
      parseExifDate(exif?.DateTimeDigitized),
    latitude,
    locationAccuracyMeters: toPositiveNumber(
      exif?.GPSHPositioningError ?? exif?.locationAccuracy
    ),
    longitude
  };
}

function parseExifDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const normalized = value
    .trim()
    .replace(
      /^(\d{4}):(\d{2}):(\d{2})/,
      "$1-$2-$3"
    );
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toFiniteNumber(value: unknown) {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numberValue) ? numberValue : null;
}

function toPositiveNumber(value: unknown) {
  const numberValue = toFiniteNumber(value);
  return numberValue !== null && numberValue > 0 ? numberValue : null;
}
