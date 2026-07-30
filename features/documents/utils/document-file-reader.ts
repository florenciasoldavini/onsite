import type { DocumentPickerAsset } from "@/features/documents/types/document";
import { File } from "expo-file-system";

export async function readDocumentBytes(asset: DocumentPickerAsset) {
  const bytes = await new File(asset.uri).bytes();
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}
