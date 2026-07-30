const mockDelete = jest.fn();
const mockDownload = jest.fn();
const mockOpenUrl = jest.fn();
const mockShare = jest.fn();
const mockSharingAvailable = jest.fn();

jest.mock("expo-file-system", () => ({
  File: class MockFile {
    exists = true;
    uri = "file:///cache/document.pdf";

    delete() {
      mockDelete();
    }

    static downloadFileAsync(...args: unknown[]) {
      return mockDownload(...args);
    }
  },
  Paths: { cache: "file:///cache" }
}));

jest.mock("expo-linking", () => ({
  openURL: (...args: unknown[]) => mockOpenUrl(...args)
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: () => mockSharingAvailable(),
  shareAsync: (...args: unknown[]) => mockShare(...args)
}));

import {
  downloadDocumentUrl,
  openDocumentUrl
} from "@/features/documents/services/document-access";

describe("native project document access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSharingAvailable.mockResolvedValue(true);
    mockDownload.mockResolvedValue({
      uri: "file:///cache/document.pdf"
    });
    mockShare.mockResolvedValue(undefined);
  });

  it("opens an inline URL with the system viewer", async () => {
    await openDocumentUrl("https://signed.example/open");
    expect(mockOpenUrl).toHaveBeenCalledWith(
      "https://signed.example/open"
    );
  });

  it("downloads, presents save/share, and removes the cached copy", async () => {
    await downloadDocumentUrl({
      filename: "site-plan.pdf",
      mimeType: "application/pdf",
      url: "https://signed.example/download"
    });

    expect(mockDownload).toHaveBeenCalledTimes(1);
    expect(mockShare).toHaveBeenCalledWith(
      "file:///cache/document.pdf",
      {
        dialogTitle: "site-plan.pdf",
        mimeType: "application/pdf"
      }
    );
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("still removes the cached copy when sharing fails", async () => {
    mockShare.mockRejectedValue(new Error("share failed"));

    await expect(
      downloadDocumentUrl({
        filename: "site-plan.pdf",
        mimeType: "application/pdf",
        url: "https://signed.example/download"
      })
    ).rejects.toThrow("share failed");
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("falls back to the signed URL when native sharing is unavailable", async () => {
    mockSharingAvailable.mockResolvedValue(false);

    await downloadDocumentUrl({
      filename: "site-plan.pdf",
      mimeType: "application/pdf",
      url: "https://signed.example/download"
    });

    expect(mockOpenUrl).toHaveBeenCalledWith(
      "https://signed.example/download"
    );
    expect(mockDownload).not.toHaveBeenCalled();
  });
});
