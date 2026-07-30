import type { DocumentDownloadOutcome } from "@/features/documents/types/document";

export function prepareDocumentOpen() {
  return window.open("", "_blank");
}

export function cancelPreparedDocumentOpen(target: unknown) {
  if (target instanceof Window) target.close();
}

export async function openDocumentUrl(url: string, target?: unknown) {
  if (!(target instanceof Window)) {
    throw new Error("The browser blocked the document window.");
  }
  target.opener = null;
  target.location.href = url;
}

export async function downloadDocumentUrl({
  filename,
  url
}: {
  filename: string;
  mimeType: string;
  url: string;
}): Promise<DocumentDownloadOutcome> {
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return { status: "download-started" };
}
