import type { ProjectPhotoAsset } from "@/features/photos/types/photo";
import { UserFacingError } from "@/shared/utils/user-facing-errors";

export async function convertHeicForPlatform(
  asset: ProjectPhotoAsset,
  blob: Blob
) {
  if (!isHeicAsset(asset)) {
    return { uri: asset.uri };
  }

  try {
    const { heicTo } = await import("heic-to");
    const jpegBlob = await heicTo({
      blob,
      quality: 0.92,
      type: "image/jpeg"
    });
    const uri = URL.createObjectURL(jpegBlob);

    return {
      revoke: () => URL.revokeObjectURL(uri),
      uri
    };
  } catch (error) {
    throw new UserFacingError(
      "We couldn't convert this Apple photo. Try selecting it from the Onzait mobile app or choose another image.",
      error
    );
  }
}

function isHeicAsset(asset: ProjectPhotoAsset) {
  const mimeType = asset.mimeType?.toLowerCase() ?? "";
  const fileName = asset.fileName?.toLowerCase() ?? "";

  return (
    mimeType.includes("heic") ||
    mimeType.includes("heif") ||
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif")
  );
}
