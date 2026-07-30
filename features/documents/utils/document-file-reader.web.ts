import type { DocumentPickerAsset } from "@/features/documents/types/document";

export async function readDocumentBytes(asset: DocumentPickerAsset) {
  if (asset.file) return asset.file.arrayBuffer();

  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error("Selected document could not be read.");
  return response.arrayBuffer();
}
