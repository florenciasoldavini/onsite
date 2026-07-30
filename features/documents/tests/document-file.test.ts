const mockReadDocumentBytes = jest.fn();

jest.mock("@/features/documents/utils/document-file-reader", () => ({
  get readDocumentBytes() {
    return mockReadDocumentBytes;
  }
}));

import {
  DocumentFileError,
  getDocumentDisplayName,
  getDocumentExtension,
  getProjectDocumentPath,
  prepareDocumentFile,
  sanitizeDownloadFilename
} from "@/features/documents/utils/document-file";

describe("project document files", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes supported extensions and creates immutable paths", () => {
    expect(getDocumentExtension("PLAN.JPEG")).toBe("jpg");
    expect(getDocumentDisplayName("  permit.final.pdf ")).toBe(
      "permit.final"
    );
    expect(
      getProjectDocumentPath({
        documentId: "document-id",
        extension: "pdf",
        projectId: "project-id"
      })
    ).toBe("projects/project-id/documents/document-id/file.pdf");
  });

  it("sanitizes attachment filenames without changing their type", () => {
    expect(sanitizeDownloadFilename('../Site: "plan"', "pdf")).toBe(
      "..-Site- -plan-.pdf"
    );
    expect(sanitizeDownloadFilename("drawing.pdf", "pdf")).toBe(
      "drawing.pdf"
    );
  });

  it.each([
    ["application/pdf", "document.pdf", [0x25, 0x50, 0x44, 0x46, 0x2d]],
    [
      "image/png",
      "document.png",
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    ],
    ["image/jpeg", "document.jpg", [0xff, 0xd8, 0xff]]
  ] as const)("accepts a valid %s signature", async (mimeType, name, bytes) => {
    mockReadDocumentBytes.mockResolvedValue(Uint8Array.from(bytes).buffer);

    await expect(
      prepareDocumentFile({
        mimeType,
        name,
        size: bytes.length,
        uri: "file:///document"
      })
    ).resolves.toMatchObject({ mimeType, originalFilename: name });
  });

  it("rejects spoofed file contents", async () => {
    mockReadDocumentBytes.mockResolvedValue(
      Uint8Array.from([0x00, 0x01, 0x02]).buffer
    );

    await expect(
      prepareDocumentFile({
        mimeType: "application/pdf",
        name: "document.pdf",
        size: 3,
        uri: "file:///document"
      })
    ).rejects.toEqual(new DocumentFileError("invalid-signature"));
  });

  it("rejects missing metadata, mismatched types, and oversized files", async () => {
    await expect(
      prepareDocumentFile({
        name: "document.pdf",
        uri: "file:///document"
      })
    ).rejects.toEqual(new DocumentFileError("missing-metadata"));
    await expect(
      prepareDocumentFile({
        mimeType: "image/png",
        name: "document.pdf",
        size: 100,
        uri: "file:///document"
      })
    ).rejects.toEqual(new DocumentFileError("unsupported-type"));
    await expect(
      prepareDocumentFile({
        mimeType: "application/pdf",
        name: "document.pdf",
        size: 25 * 1024 * 1024 + 1,
        uri: "file:///document"
      })
    ).rejects.toEqual(new DocumentFileError("too-large"));
  });
});
