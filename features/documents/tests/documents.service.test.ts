import type { ProjectDocument } from "@/features/documents/types/document";

const mocks = {
  accessDownload: jest.fn(),
  accessOpen: jest.fn(),
  cancelOpen: jest.fn(),
  captureException: jest.fn(),
  createSignedUrl: jest.fn(),
  getRow: jest.fn(),
  insertRow: jest.fn(),
  listRows: jest.fn(),
  prepareFile: jest.fn(),
  prepareOpen: jest.fn(),
  removeObject: jest.fn(),
  softDeleteRow: jest.fn(),
  updateRow: jest.fn(),
  uploadObject: jest.fn()
};

jest.mock("@/features/documents/repositories/document-storage.repository", () => ({
  get createProjectDocumentSignedUrl() {
    return mocks.createSignedUrl;
  },
  get removeProjectDocumentObject() {
    return mocks.removeObject;
  },
  get uploadProjectDocumentObject() {
    return mocks.uploadObject;
  }
}));

jest.mock("@/features/documents/repositories/documents.repository", () => ({
  get getProjectDocumentRow() {
    return mocks.getRow;
  },
  get insertProjectDocumentRow() {
    return mocks.insertRow;
  },
  get listProjectDocumentRows() {
    return mocks.listRows;
  },
  get softDeleteProjectDocumentRow() {
    return mocks.softDeleteRow;
  },
  get updateProjectDocumentRow() {
    return mocks.updateRow;
  }
}));

jest.mock("@/features/documents/services/document-access", () => ({
  get cancelPreparedDocumentOpen() {
    return mocks.cancelOpen;
  },
  get downloadDocumentUrl() {
    return mocks.accessDownload;
  },
  get openDocumentUrl() {
    return mocks.accessOpen;
  },
  get prepareDocumentOpen() {
    return mocks.prepareOpen;
  }
}));

jest.mock("@/features/documents/utils/document-file", () => ({
  get getProjectDocumentPath() {
    return jest.requireActual(
      "@/features/documents/utils/document-file"
    ).getProjectDocumentPath;
  },
  get prepareDocumentFile() {
    return mocks.prepareFile;
  },
  get sanitizeDownloadFilename() {
    return jest.requireActual(
      "@/features/documents/utils/document-file"
    ).sanitizeDownloadFilename;
  }
}));

jest.mock("@/infrastructure/monitoring/sentry", () => ({
  Sentry: {
    get captureException() {
      return mocks.captureException;
    }
  }
}));

jest.mock("expo-crypto", () => ({
  randomUUID: () => "20000000-0000-4000-8000-000000000001"
}));

import {
  accessProjectDocument,
  softDeleteProjectDocument,
  uploadProjectDocument
} from "@/features/documents/services/documents.service";

function document(): ProjectDocument {
  return {
    category: "drawing",
    created_at: "2026-07-30T12:00:00.000Z",
    deleted_at: null,
    file_extension: "pdf",
    file_size_bytes: 5,
    id: "20000000-0000-4000-8000-000000000001",
    mime_type: "application/pdf",
    name: "Site plan",
    object_path:
      "projects/project-id/documents/20000000-0000-4000-8000-000000000001/file.pdf",
    original_filename: "site plan.pdf",
    project_id: "project-id",
    updated_at: null,
    uploaded_by: "user-id",
    uploaded_by_display_name: "Site Manager"
  };
}

describe("project document workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.prepareFile.mockResolvedValue({
      bytes: Uint8Array.from([1, 2, 3, 4, 5]).buffer,
      extension: "pdf",
      mimeType: "application/pdf",
      originalFilename: "site plan.pdf",
      size: 5
    });
    mocks.uploadObject.mockResolvedValue(undefined);
    mocks.insertRow.mockResolvedValue(document());
    mocks.removeObject.mockResolvedValue(undefined);
    mocks.getRow.mockResolvedValue(document());
    mocks.createSignedUrl.mockResolvedValue("https://signed.example/file");
    mocks.prepareOpen.mockReturnValue({ reserved: true });
  });

  it("validates, uploads, persists, and reports each upload stage", async () => {
    const stages: string[] = [];

    await expect(
      uploadProjectDocument({
        asset: {
          mimeType: "application/pdf",
          name: "site plan.pdf",
          size: 5,
          uri: "file:///plan.pdf"
        },
        category: "drawing",
        name: "Site plan",
        onStageChange: (stage) => stages.push(stage),
        projectId: "project-id"
      })
    ).resolves.toEqual({ document: document(), status: "saved" });

    expect(stages).toEqual(["validating", "uploading", "saving", "saved"]);
    expect(mocks.uploadObject).toHaveBeenCalledWith({
      bytes: expect.any(ArrayBuffer),
      mimeType: "application/pdf",
      path: document().object_path
    });
    expect(mocks.insertRow).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "drawing",
        object_path: document().object_path,
        project_id: "project-id"
      })
    );
  });

  it("does not persist when the object upload fails", async () => {
    mocks.uploadObject.mockRejectedValue(new Error("storage unavailable"));

    await expect(
      uploadProjectDocument({
        asset: { name: "site plan.pdf", uri: "file:///plan.pdf" },
        category: "drawing",
        name: "Site plan",
        projectId: "project-id"
      })
    ).rejects.toThrow("storage unavailable");
    expect(mocks.insertRow).not.toHaveBeenCalled();
  });

  it("compensates an insert failure and reports failed compensation", async () => {
    mocks.insertRow.mockRejectedValue(new Error("database unavailable"));
    mocks.removeObject.mockRejectedValue(new Error("cleanup unavailable"));

    await expect(
      uploadProjectDocument({
        asset: { name: "site plan.pdf", uri: "file:///plan.pdf" },
        category: "drawing",
        name: "Site plan",
        projectId: "project-id"
      })
    ).rejects.toThrow("database unavailable");
    expect(mocks.removeObject).toHaveBeenCalledWith(document().object_path);
    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { storage_cleanup: "project-document-compensation" }
      })
    );
  });

  it("soft-deletes before cleanup and reports cleanup failure", async () => {
    mocks.removeObject.mockRejectedValue(new Error("cleanup unavailable"));

    await expect(
      softDeleteProjectDocument(document().id)
    ).resolves.toBeUndefined();
    expect(mocks.softDeleteRow.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.removeObject.mock.invocationCallOrder[0]
    );
    expect(mocks.captureException).toHaveBeenCalledTimes(1);
  });

  it.each(["open", "download"] as const)(
    "creates and consumes a signed %s URL",
    async (mode) => {
      await accessProjectDocument({ document: document(), mode });

      expect(mocks.createSignedUrl).toHaveBeenCalledWith({
        extension: "pdf",
        filename: "site plan.pdf",
        mode,
        path: document().object_path
      });
      if (mode === "open") {
        expect(mocks.accessOpen).toHaveBeenCalledWith(
          "https://signed.example/file",
          { reserved: true }
        );
      } else {
        expect(mocks.accessDownload).toHaveBeenCalledWith({
          filename: "site plan.pdf",
          mimeType: "application/pdf",
          url: "https://signed.example/file"
        });
      }
    }
  );
});
