import {
  useProjectPhoto,
  useSoftDeleteProjectPhoto,
  useUpdateProjectPhoto
} from "@/features/photos/hooks/use-project-photos";
import ProjectPhotoDetailScreen from "@/features/photos/screens/project-photo-detail-screen";
import type { ProjectPhoto } from "@/features/photos/types/photo";
import { useProjectPermission } from "@/features/projects/hooks/use-project-collaboration";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockRefetch = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockShowToast = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({
    photoId: "photo-1",
    projectId: "project-1"
  }),
  useRouter: () => ({ replace: mockReplace })
}));

jest.mock("@/features/photos/hooks/use-project-photos", () => ({
  useProjectPhoto: jest.fn(),
  useSoftDeleteProjectPhoto: jest.fn(),
  useUpdateProjectPhoto: jest.fn()
}));

jest.mock("@/features/projects/hooks/use-project-collaboration", () => ({
  useProjectPermission: jest.fn()
}));

jest.mock("@/shared/ui/components/toast", () => ({
  useAppToast: jest.fn()
}));

const photo: ProjectPhoto = {
  caption: "Foundation excavation",
  captured_at: "2026-07-28T10:00:00.000Z",
  created_at: "2026-07-28T10:01:00.000Z",
  deleted_at: null,
  file_size_bytes: 1024,
  full_path: "owner/project/full.jpg",
  full_url: "https://signed.example/full.jpg",
  height: 800,
  id: "photo-1",
  is_marketing: false,
  kind: "progress",
  latitude: null,
  location_accuracy_meters: null,
  location_source: null,
  longitude: null,
  mime_type: "image/jpeg",
  owner_id: "owner-1",
  project_id: "project-1",
  thumbnail_path: "owner/project/thumb.jpg",
  updated_at: null,
  uploaded_by: "owner-1",
  width: 1200
};

describe("ProjectPhotoDetailScreen", () => {
  beforeEach(() => {
    jest.mocked(useProjectPermission).mockReturnValue({
      allowed: true,
      isLoading: false
    } as never);
    jest.mocked(useProjectPhoto).mockReturnValue({
      data: photo,
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    jest.mocked(useUpdateProjectPhoto).mockReturnValue({
      error: null,
      isError: false,
      isPending: false,
      mutateAsync: mockUpdate
    } as never);
    jest.mocked(useSoftDeleteProjectPhoto).mockReturnValue({
      isPending: false,
      mutateAsync: mockDelete
    } as never);
    jest.mocked(useAppToast).mockReturnValue({ show: mockShowToast });
    mockUpdate.mockResolvedValue(photo);
    mockDelete.mockResolvedValue(undefined);
  });

  it("updates changed photo details", async () => {
    await renderWithAppProviders(<ProjectPhotoDetailScreen />);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Foundation excavation")
      ).toBeOnTheScreen();
    });
    await fireEvent.changeText(
      screen.getByDisplayValue("Foundation excavation"),
      "Footings ready"
    );
    await fireEvent.press(screen.getByText("Save changes"));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        caption: "Footings ready",
        is_marketing: false,
        kind: "progress"
      });
      expect(mockShowToast).toHaveBeenCalledWith({
        title: "Photo details updated",
        tone: "success"
      });
    });
  });

  it("requires confirmation before deleting a photo", async () => {
    await renderWithAppProviders(<ProjectPhotoDetailScreen />);

    await fireEvent.press(screen.getByText("Delete photo"));
    expect(screen.getByText("Delete photo?")).toBeOnTheScreen();
    expect(mockDelete).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText("Delete"));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("photo-1");
      expect(mockReplace).toHaveBeenCalledWith(
        "/projects/project-1/photos"
      );
    });
  });

  it("rejects a photo belonging to another project", async () => {
    jest.mocked(useProjectPhoto).mockReturnValue({
      data: { ...photo, project_id: "project-2" },
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    await renderWithAppProviders(<ProjectPhotoDetailScreen />);

    expect(screen.getByText("Photo not found")).toBeOnTheScreen();
  });
});
