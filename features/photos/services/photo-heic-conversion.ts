import type { ProjectPhotoAsset } from "@/features/photos/types/photo";

export async function convertHeicForPlatform(
  asset: ProjectPhotoAsset,
  _blob: Blob
): Promise<{ revoke?: () => void; uri: string }> {
  return { uri: asset.uri };
}
