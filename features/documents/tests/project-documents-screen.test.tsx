import {
  useAccessProjectDocument,
  useDeleteProjectDocument,
  useProjectDocuments,
  useUpdateProjectDocument
} from "@/features/documents/hooks/use-project-documents";
import ProjectDocumentsScreen from "@/features/documents/screens/project-documents-screen";
import type { ProjectDocument } from "@/features/documents/types/document";
import { useProjectPermission } from "@/features/projects/hooks/use-project-collaboration";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefetch = jest.fn();
const mockPermissionRefetch = jest.fn();
const mockDocumentRefetch = jest.fn();
const mockShowToast = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace })
}));

jest.mock("@/features/documents/hooks/use-project-documents", () => ({
  useAccessProjectDocument: jest.fn(),
  useDeleteProjectDocument: jest.fn(),
  useProjectDocuments: jest.fn(),
  useUpdateProjectDocument: jest.fn()
}));

jest.mock("@/features/projects/hooks/use-projects", () => ({
  useProject: jest.fn()
}));

jest.mock("@/features/projects/hooks/use-project-collaboration", () => ({
  useProjectPermission: jest.fn()
}));

jest.mock("@/shared/ui/components/toast", () => ({
  useAppToast: jest.fn()
}));

function document(): ProjectDocument {
  return {
    category: "permit",
    created_at: "2026-07-30T12:00:00.000Z",
    deleted_at: null,
    file_extension: "pdf",
    file_size_bytes: 2048,
    id: "20000000-0000-4000-8000-000000000001",
    mime_type: "application/pdf",
    name: "Building permit",
    object_path:
      "projects/project-id/documents/20000000-0000-4000-8000-000000000001/file.pdf",
    original_filename: "approved-permit.pdf",
    project_id: "project-id",
    updated_at: null,
    uploaded_by: "user-id",
    uploaded_by_display_name: "Project Manager"
  };
}

function setDocumentQuery(overrides: Record<string, unknown> = {}) {
  jest.mocked(useProjectDocuments).mockReturnValue({
    data: { pages: [{ items: [], nextOffset: null }] },
    error: null,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isError: false,
    isFetchingNextPage: false,
    isLoading: false,
    refetch: mockDocumentRefetch,
    ...overrides
  } as never);
}

describe("ProjectDocumentsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useProject).mockReturnValue({
      data: { id: "project-id", name: "River House" },
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    jest.mocked(useProjectPermission).mockReturnValue({
      allowed: true,
      isError: false,
      isLoading: false,
      refetch: mockPermissionRefetch
    } as never);
    setDocumentQuery();
    jest.mocked(useUpdateProjectDocument).mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn()
    } as never);
    jest.mocked(useDeleteProjectDocument).mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn()
    } as never);
    jest.mocked(useAccessProjectDocument).mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn()
    } as never);
    jest.mocked(useAppToast).mockReturnValue({ show: mockShowToast });
  });

  it("shows the writer empty state and upload action", async () => {
    await renderWithAppProviders(
      <ProjectDocumentsScreen projectId="project-id" />
    );

    expect(screen.getByText("No documents yet")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Add document"));
    expect(mockPush).toHaveBeenCalledWith(
      "/projects/project-id/documents/new"
    );
  });

  it("keeps contributors read-only while preserving open and download", async () => {
    jest.mocked(useProjectPermission).mockReturnValue({
      allowed: false,
      isError: false,
      isLoading: false,
      refetch: mockPermissionRefetch
    } as never);
    setDocumentQuery({
      data: { pages: [{ items: [document()], nextOffset: null }] }
    });

    await renderWithAppProviders(
      <ProjectDocumentsScreen projectId="project-id" />
    );

    expect(screen.getByText("Building permit")).toBeOnTheScreen();
    expect(screen.getByText("Open")).toBeOnTheScreen();
    expect(screen.getByText("Download")).toBeOnTheScreen();
    expect(screen.queryByText("Edit")).not.toBeOnTheScreen();
    expect(screen.queryByText("Delete document")).not.toBeOnTheScreen();
    expect(screen.queryByText("Add document")).not.toBeOnTheScreen();
  });

  it("shows a retryable query error separately from an empty catalog", async () => {
    setDocumentQuery({
      data: undefined,
      error: new Error("provider details"),
      isError: true
    });

    await renderWithAppProviders(
      <ProjectDocumentsScreen projectId="project-id" />
    );

    expect(screen.getByText("Documents unavailable")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Retry"));
    expect(mockDocumentRefetch).toHaveBeenCalledTimes(1);
  });
});
