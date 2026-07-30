import {
  createProjectDocumentSignedUrl,
  removeProjectDocumentObject,
  uploadProjectDocumentObject
} from "@/features/documents/repositories/document-storage.repository";
import { requireSupabase } from "@/infrastructure/supabase/repository";

jest.mock("@/infrastructure/supabase/repository", () => ({
  requireSupabase: jest.fn(),
  toRepositoryError: jest.fn((error) => error)
}));

describe("project document Storage repository", () => {
  const upload = jest.fn();
  const remove = jest.fn();
  const createSignedUrl = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    upload.mockResolvedValue({ error: null });
    remove.mockResolvedValue({ error: null });
    createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed.example/document" },
      error: null
    });
    jest.mocked(requireSupabase).mockReturnValue({
      storage: {
        from: () => ({ createSignedUrl, remove, upload })
      }
    } as never);
  });

  it("uploads one immutable object without upsert", async () => {
    const bytes = Uint8Array.from([1, 2, 3]).buffer;
    await uploadProjectDocumentObject({
      bytes,
      mimeType: "application/pdf",
      path: "projects/project-id/documents/document-id/file.pdf"
    });

    expect(upload).toHaveBeenCalledWith(
      "projects/project-id/documents/document-id/file.pdf",
      bytes,
      {
        cacheControl: "31536000",
        contentType: "application/pdf",
        upsert: false
      }
    );
  });

  it("requests five-minute inline and attachment signed URLs", async () => {
    await createProjectDocumentSignedUrl({
      extension: "pdf",
      filename: "site plan.pdf",
      mode: "open",
      path: "projects/project-id/documents/document-id/file.pdf"
    });
    await createProjectDocumentSignedUrl({
      extension: "pdf",
      filename: "site plan.pdf",
      mode: "download",
      path: "projects/project-id/documents/document-id/file.pdf"
    });

    expect(createSignedUrl).toHaveBeenNthCalledWith(
      1,
      "projects/project-id/documents/document-id/file.pdf",
      300,
      { download: false }
    );
    expect(createSignedUrl).toHaveBeenNthCalledWith(
      2,
      "projects/project-id/documents/document-id/file.pdf",
      300,
      { download: "site plan.pdf" }
    );
  });

  it("refuses cleanup outside the document path contract", async () => {
    await expect(
      removeProjectDocumentObject("projects/project-id/photos/photo.jpg")
    ).rejects.toThrow("Refusing to remove");
    expect(remove).not.toHaveBeenCalled();
  });
});
