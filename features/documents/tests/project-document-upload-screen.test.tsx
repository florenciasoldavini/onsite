import { useUploadProjectDocument } from "@/features/documents/hooks/use-project-documents";
import ProjectDocumentUploadScreen from "@/features/documents/screens/project-document-upload-screen";
import { useProjectPermission } from "@/features/projects/hooks/use-project-collaboration";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as DocumentPicker from "expo-document-picker";

const mockReplace = jest.fn();
const mockUpload = jest.fn();
const mockRefetch = jest.fn();
const mockPermissionRefetch = jest.fn();
const mockShowToast = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace })
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn()
}));

jest.mock("@/features/documents/hooks/use-project-documents", () => ({
  useUploadProjectDocument: jest.fn()
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

describe("ProjectDocumentUploadScreen", () => {
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
    jest.mocked(useUploadProjectDocument).mockReturnValue({
      isPending: false,
      mutateAsync: mockUpload
    } as never);
    jest.mocked(useAppToast).mockReturnValue({ show: mockShowToast });
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      assets: [
        {
          lastModified: 0,
          mimeType: "application/pdf",
          name: "approved-permit.pdf",
          size: 2048,
          uri: "file:///approved-permit.pdf"
        }
      ],
      canceled: false
    });
    mockUpload.mockResolvedValue({
      document: {
        id: "document-id",
        name: "approved-permit"
      },
      status: "saved"
    });
  });

  it("prefills the display name and requires category selection", async () => {
    await renderWithAppProviders(
      <ProjectDocumentUploadScreen projectId="project-id" />
    );

    const uploadButton = screen.getByRole("button", {
      name: "Upload document"
    });
    expect(uploadButton).toBeDisabled();

    await fireEvent.press(screen.getByText("Choose file"));
    expect(await screen.findByDisplayValue("approved-permit"))
      .toBeOnTheScreen();
    expect(uploadButton).toBeDisabled();

    await fireEvent.press(screen.getByText("Permit"));
    await waitFor(() => expect(uploadButton).not.toBeDisabled());
    await fireEvent.press(uploadButton);

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith({
        asset: expect.objectContaining({
          name: "approved-permit.pdf"
        }),
        category: "permit",
        name: "approved-permit",
        onStageChange: expect.any(Function)
      });
      expect(mockReplace).toHaveBeenCalledWith(
        "/projects/project-id/documents"
      );
    });
  });

  it("renders finite forbidden feedback for read-only participants", async () => {
    jest.mocked(useProjectPermission).mockReturnValue({
      allowed: false,
      isError: false,
      isLoading: false,
      refetch: mockPermissionRefetch
    } as never);

    await renderWithAppProviders(
      <ProjectDocumentUploadScreen projectId="project-id" />
    );

    expect(screen.getByText("Project unavailable")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "You don't have permission to access this project."
      )
    ).toBeOnTheScreen();
    expect(screen.queryByText("Choose file")).not.toBeOnTheScreen();
  });
});
