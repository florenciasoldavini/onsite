import { useProjectPhotos } from "@/features/photos/hooks/use-project-photos";
import ProjectPhotosScreen from "@/features/photos/screens/project-photos-screen";
import type { ProjectPhoto } from "@/features/photos/types/photo";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useProjectPermission } from "@/features/projects/hooks/use-project-collaboration";
import type { Project } from "@/features/projects/types/project.types";
import { renderWithAppProviders } from "@/tests/support/render";
import { userEvent } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockProjectRefetch = jest.fn();
const mockPhotosRefetch = jest.fn();
const mockFetchNextPage = jest.fn();
const mockProjectId = "10000000-0000-4000-8000-000000000001";
const mockPhotoId = "20000000-0000-4000-8000-000000000001";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  })
}));

jest.mock("@/features/projects/hooks/use-projects", () => ({
  useProject: jest.fn()
}));

jest.mock("@/features/projects/hooks/use-project-collaboration", () => ({
  useProjectPermission: jest.fn()
}));

jest.mock("@/features/photos/hooks/use-project-photos", () => ({
  useProjectPhotos: jest.fn()
}));

jest.mock("@/features/photos/components/project-photo-card", () => {
  const React = jest.requireActual("react");
  const { Pressable, Text } = jest.requireActual("react-native");

  return {
    ProjectPhotoCard: ({
      onPress,
      photo
    }: {
      onPress: () => void;
      photo: ProjectPhoto;
    }) =>
      React.createElement(
        Pressable,
        { accessibilityRole: "button", onPress },
        React.createElement(Text, null, `photo-${photo.id}`)
      )
  };
});

const project: Project = {
  address: "1 Site Road",
  building_type: "residential",
  client_id: null,
  cover_image_path: null,
  created_at: "2026-07-28T10:00:00.000Z",
  deleted_at: null,
  description: null,
  end_date: null,
  estimated_end_date: null,
  estimated_start_date: null,
  google_place_id: "place-1",
  id: mockProjectId,
  latitude: -34.6,
  longitude: -58.4,
  name: "River House",
  owner_id: "owner-1",
  phase: "concept",
  progress_percentage: 0,
  project_type: "new_build",
  start_date: null,
  status: "planned",
  updated_at: null
};

const photo: ProjectPhoto = {
  caption: null,
  captured_at: "2026-07-28T10:00:00.000Z",
  created_at: "2026-07-28T10:00:00.000Z",
  deleted_at: null,
  file_size_bytes: 1024,
  full_path: "owner-1/project-1/photo-1/full.jpg",
  height: 1200,
  id: mockPhotoId,
  is_marketing: false,
  kind: "progress",
  latitude: null,
  location_accuracy_meters: null,
  location_source: null,
  longitude: null,
  mime_type: "image/jpeg",
  owner_id: "owner-1",
  project_id: mockProjectId,
  thumbnail_path: "owner-1/project-1/photo-1/thumb.jpg",
  updated_at: null,
  uploaded_by: "owner-1",
  width: 1600
};

function mockProjectQuery(
  overrides: Partial<ReturnType<typeof useProject>> = {}
) {
  jest.mocked(useProject).mockReturnValue({
    data: project,
    error: null,
    isError: false,
    isLoading: false,
    refetch: mockProjectRefetch,
    ...overrides
  } as never);
}

function mockPhotosQuery(
  overrides: Partial<ReturnType<typeof useProjectPhotos>> = {}
) {
  jest.mocked(useProjectPhotos).mockReturnValue({
    data: { pages: [{ items: [], nextOffset: null }], pageParams: [0] },
    error: null,
    fetchNextPage: mockFetchNextPage,
    hasNextPage: false,
    isError: false,
    isFetchingNextPage: false,
    isLoading: false,
    refetch: mockPhotosRefetch,
    ...overrides
  } as never);
}

describe("ProjectPhotosScreen", () => {
  beforeEach(() => {
    jest.mocked(useProjectPermission).mockReturnValue({
      allowed: true,
      isLoading: false
    } as never);
    mockProjectQuery();
    mockPhotosQuery();
  });

  it("retries a failed project query", async () => {
    const user = userEvent.setup();
    mockProjectQuery({
      data: undefined,
      error: new Error("provider details"),
      isError: true
    });
    const view = await renderWithAppProviders(
      <ProjectPhotosScreen projectId={mockProjectId} />
    );

    expect(view.getByText("Project unavailable")).toBeOnTheScreen();
    await user.press(view.getByRole("button", { name: "Retry" }));

    expect(mockProjectRefetch).toHaveBeenCalledTimes(1);
  });

  it("routes back when the project no longer exists", async () => {
    const user = userEvent.setup();
    mockProjectQuery({ data: undefined });
    const view = await renderWithAppProviders(
      <ProjectPhotosScreen projectId={mockProjectId} />
    );

    expect(view.getByText("Project not found")).toBeOnTheScreen();
    await user.press(view.getByRole("button", { name: "Back to projects" }));

    expect(mockReplace).toHaveBeenCalledWith("/projects");
  });

  it("shows an actionable empty state and opens photo creation", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(
      <ProjectPhotosScreen projectId={mockProjectId} />
    );

    expect(view.getByText("No project photos yet")).toBeOnTheScreen();
    await user.press(view.getByRole("button", { name: "Add project photos" }));

    expect(mockPush).toHaveBeenCalledWith(
      `/projects/${mockProjectId}/photos/new`
    );
  });

  it("shows filtered-empty feedback after selecting marketing photos", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(
      <ProjectPhotosScreen projectId={mockProjectId} />
    );

    await user.press(view.getByRole("button", { name: "Marketing" }));

    expect(view.getByText("No matching photos")).toBeOnTheScreen();
    expect(useProjectPhotos).toHaveBeenLastCalledWith(mockProjectId, {
      kind: "all",
      marketing: "marketing"
    });
  });

  it("opens a saved photo from the results grid", async () => {
    const user = userEvent.setup();
    mockPhotosQuery({
      data: {
        pageParams: [0],
        pages: [{ items: [photo], nextOffset: null }]
      }
    });
    const view = await renderWithAppProviders(
      <ProjectPhotosScreen projectId={mockProjectId} />
    );

    await user.press(
      view.getByRole("button", { name: `photo-${mockPhotoId}` })
    );

    expect(mockPush).toHaveBeenCalledWith(
      `/projects/${mockProjectId}/photos/${mockPhotoId}`
    );
  });
});
