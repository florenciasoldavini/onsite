import type { User } from "@/features/auth/types/auth.types";
import {
  useProjectPhotos,
  useSoftDeleteProjectPhoto,
  useUploadProjectPhotos
} from "@/features/photos/hooks/use-project-photos";
import {
  listProjectPhotos,
  softDeleteProjectPhoto,
  uploadProjectPhotoBatch
} from "@/features/photos/services/photos.service";
import type { ProjectPhoto } from "@/features/photos/types/photo";
import {
  createTestQueryClient,
  renderHookWithAppProviders
} from "@/tests/support/render";
import { act, waitFor } from "@testing-library/react-native";

jest.mock("@/features/photos/services/photos.service", () => ({
  getProjectPhoto: jest.fn(),
  listProjectPhotos: jest.fn(),
  softDeleteProjectPhoto: jest.fn(),
  updateProjectPhoto: jest.fn(),
  uploadProjectPhotoBatch: jest.fn()
}));

const user: User = {
  avatar: null,
  created_at: new Date("2026-07-28T10:00:00.000Z"),
  deleted_at: null,
  email: "owner@example.com",
  first_name: "Site",
  id: "owner-1",
  last_name: "Manager",
  phone_number: null,
  role: "user",
  updated_at: null,
  welcome_email_sent_at: new Date("2026-07-28T10:01:00.000Z")
};

const photo: ProjectPhoto = {
  caption: null,
  captured_at: "2026-07-28T10:00:00.000Z",
  created_at: "2026-07-28T10:00:00.000Z",
  deleted_at: null,
  file_size_bytes: 1024,
  full_path: "owner-1/project-1/photo-1/full.jpg",
  height: 1200,
  id: "photo-1",
  is_marketing: false,
  kind: "progress",
  latitude: null,
  location_accuracy_meters: null,
  location_source: null,
  longitude: null,
  mime_type: "image/jpeg",
  owner_id: user.id,
  project_id: "project-1",
  thumbnail_path: "owner-1/project-1/photo-1/thumb.jpg",
  updated_at: null,
  uploaded_by: user.id,
  width: 1600
};

describe("useProjectPhotos", () => {
  it("waits for both project and authentication context", async () => {
    const queryClient = createTestQueryClient();
    const { result, unmount } = await renderHookWithAppProviders(
      () => useProjectPhotos("project-1", {}),
      { queryClient }
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(listProjectPhotos).not.toHaveBeenCalled();
    await unmount();
    queryClient.clear();
  });

  it("loads normalized filters through a bounded photo page", async () => {
    jest.mocked(listProjectPhotos).mockResolvedValue({
      items: [photo],
      nextOffset: null
    });
    const queryClient = createTestQueryClient();
    const { result, unmount } = await renderHookWithAppProviders(
      () =>
        useProjectPhotos("project-1", {
          kind: "progress",
          marketing: "marketing"
        }),
      { auth: { user }, queryClient }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(listProjectPhotos).toHaveBeenCalledWith({
      filters: { kind: "progress", marketing: "marketing" },
      offset: 0,
      pageSize: 24,
      projectId: "project-1",
      userId: user.id,
      userRole: "user"
    });
    await unmount();
    queryClient.clear();
  });
});

describe("useUploadProjectPhotos", () => {
  it("primes saved photo details and invalidates the project gallery", async () => {
    jest.mocked(uploadProjectPhotoBatch).mockResolvedValue([
      {
        error: null,
        photo,
        photoId: photo.id,
        status: "saved"
      }
    ]);
    const queryClient = createTestQueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    const { result, unmount } = await renderHookWithAppProviders(
      () => useUploadProjectPhotos("project-1"),
      { queryClient }
    );

    await act(async () => {
      await result.current.mutateAsync({ drafts: [] });
    });

    expect(
      queryClient.getQueryData(["project-photos", "detail", photo.id])
    ).toEqual(photo);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["project-photos", "project-1"]
    });
    await unmount();
    queryClient.clear();
  });
});

describe("useSoftDeleteProjectPhoto", () => {
  it("removes the detail cache and invalidates gallery queries", async () => {
    jest.mocked(softDeleteProjectPhoto).mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["project-photos", "detail", photo.id],
      photo
    );
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    const { result, unmount } = await renderHookWithAppProviders(
      () => useSoftDeleteProjectPhoto(),
      { queryClient }
    );

    await act(async () => {
      await result.current.mutateAsync(photo.id);
    });

    expect(softDeleteProjectPhoto).toHaveBeenCalledWith(photo.id);
    expect(
      queryClient.getQueryData(["project-photos", "detail", photo.id])
    ).toBeUndefined();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["project-photos"]
    });
    await unmount();
    queryClient.clear();
  });
});
