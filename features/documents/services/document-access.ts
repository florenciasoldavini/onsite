import { File, Paths } from "expo-file-system";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import type { DocumentDownloadOutcome } from "@/features/documents/types/document";

export function prepareDocumentOpen() {
  return null;
}

export function cancelPreparedDocumentOpen(_target: unknown) {}

export async function openDocumentUrl(url: string, _target?: unknown) {
  await Linking.openURL(url);
}

export async function downloadDocumentUrl({
  filename,
  mimeType,
  url
}: {
  filename: string;
  mimeType: string;
  url: string;
}): Promise<DocumentDownloadOutcome> {
  if (!(await Sharing.isAvailableAsync())) {
    await Linking.openURL(url);
    return { status: "opened" };
  }

  const destination = new File(
    Paths.cache,
    `${Date.now()}-${filename}`
  );

  try {
    const downloaded = await File.downloadFileAsync(url, destination);
    await Sharing.shareAsync(downloaded.uri, {
      dialogTitle: filename,
      mimeType
    });
    return { status: "shared" };
  } finally {
    if (destination.exists) destination.delete();
  }
}
