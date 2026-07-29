import { useUploadProjectPhotos } from "@/features/photos/hooks/use-project-photos";
import ProjectPhotoUploadScreen from "@/features/photos/screens/project-photo-upload-screen";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useProjectPermission } from "@/features/projects/hooks/use-project-collaboration";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";

const mockReplace = jest.fn();
const mockRefetch = jest.fn();
const mockPermissionRefetch = jest.fn();
const mockUpload = jest.fn();
const mockShowToast = jest.fn();
const mockProjectId = "10000000-0000-4000-8000-000000000001";

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace })
}));

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn()
}));

jest.mock("expo-image-picker", () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn()
}));

jest.mock("@/features/photos/hooks/use-project-photos", () => ({
  useUploadProjectPhotos: jest.fn()
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

jest.mock("@/features/photos/components/project-photo-draft-card", () => {
  const React = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");

  return {
    ProjectPhotoDraftCard: ({ photo }: { photo: { id: string } }) =>
      React.createElement(Text, null, `draft-${photo.id}`)
  };
});

describe("ProjectPhotoUploadScreen", () => {
  beforeEach(() => {
    jest.mocked(useProjectPermission).mockReturnValue({
      allowed: true,
      isError: false,
      isLoading: false,
      refetch: mockPermissionRefetch
    } as never);
    jest
      .mocked(Crypto.randomUUID)
      .mockReturnValue("11111111-1111-4111-8111-111111111111");
    jest.mocked(useProject).mockReturnValue({
      data: { id: mockProjectId, name: "River House" },
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    jest.mocked(useUploadProjectPhotos).mockReturnValue({
      error: null,
      isError: false,
      isPending: false,
      mutateAsync: mockUpload
    } as never);
    jest.mocked(useAppToast).mockReturnValue({ show: mockShowToast });
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      assets: [
        {
          height: 800,
          mimeType: "image/jpeg",
          uri: "file:///site.jpg",
          width: 1200
        }
      ],
      canceled: false
    });
    jest
      .mocked(ImagePicker.requestMediaLibraryPermissionsAsync)
      .mockResolvedValue({
        canAskAgain: true,
        expires: "never",
        granted: true,
        status: "granted" as never
      });
    mockUpload.mockResolvedValue([
      {
        error: null,
        photo: { id: "saved-photo-1" },
        photoId: "photo-draft-1",
        status: "saved"
      }
    ]);
  });

  it("adds a library photo and uploads the reviewed batch", async () => {
    await renderWithAppProviders(
      <ProjectPhotoUploadScreen projectId={mockProjectId} />
    );

    expect(screen.getByText("Add photos (0/20)")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Photo library"));
    expect(
      await screen.findByText("draft-11111111-1111-4111-8111-111111111111")
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Upload photos"));

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith({
        drafts: [
          expect.objectContaining({
            id: "11111111-1111-4111-8111-111111111111",
            kind: "general"
          })
        ],
        onStageChange: expect.any(Function)
      });
      expect(mockReplace).toHaveBeenCalledWith(
        `/projects/${mockProjectId}/photos`
      );
    });
  });

  it("explains denied camera permission", async () => {
    jest.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValue({
      canAskAgain: false,
      expires: "never",
      granted: false,
      status: "denied" as never
    });
    await renderWithAppProviders(
      <ProjectPhotoUploadScreen projectId={mockProjectId} />
    );

    await fireEvent.press(screen.getByText("Camera"));

    expect(
      await screen.findByText(
        "Camera access is disabled. Enable Camera access for Onzait in your device settings, then try again."
      )
    ).toBeOnTheScreen();
  });

  it("retries a failed project query", async () => {
    jest.mocked(useProject).mockReturnValue({
      data: undefined,
      error: new Error("database details"),
      isError: true,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    await renderWithAppProviders(
      <ProjectPhotoUploadScreen projectId={mockProjectId} />
    );

    expect(screen.getByText("Project unavailable")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Retry"));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
