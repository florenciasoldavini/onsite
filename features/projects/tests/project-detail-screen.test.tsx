import { useClient } from "@/features/clients/hooks/use-clients";
import {
  useProject,
  useSoftDeleteProject
} from "@/features/projects/hooks/use-projects";
import ProjectDetailScreen from "@/features/projects/screens/project-detail-screen";
import { useProjectAccess } from "@/features/projects/hooks/use-project-collaboration";
import type { Project } from "@/features/projects/types/project.types";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import {
  fireEvent,
  screen,
  waitFor
} from "@testing-library/react-native";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefetch = jest.fn();
const mockDelete = jest.fn();
const mockShowToast = jest.fn();
let mockProjectId: string | string[] = "project-1";

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ projectId: mockProjectId }),
  useRouter: () => ({ push: mockPush, replace: mockReplace })
}));

jest.mock("@/features/projects/hooks/use-projects", () => ({
  useProject: jest.fn(),
  useSoftDeleteProject: jest.fn()
}));

jest.mock("@/features/projects/hooks/use-project-collaboration", () => ({
  useProjectAccess: jest.fn()
}));

jest.mock("@/features/clients/hooks/use-clients", () => ({
  useClient: jest.fn()
}));

jest.mock("@/shared/hooks/use-layout-mode", () => ({
  useLayoutMode: jest.fn()
}));

jest.mock("@/shared/ui/components/toast", () => ({
  useAppToast: jest.fn()
}));

const project: Project = {
  address: "1 Site Road",
  building_type: "residential",
  client_id: null,
  cover_image_path: null,
  created_at: "2026-07-28T10:00:00.000Z",
  deleted_at: null,
  description: null,
  end_date: null,
  estimated_end_date: "2026-12-31",
  estimated_start_date: null,
  google_place_id: "place-1",
  id: "project-1",
  latitude: -34.6,
  longitude: -58.4,
  name: "River House",
  owner_id: "owner-1",
  phase: "concept",
  progress_percentage: 25,
  project_type: "new_build",
  start_date: null,
  status: "planned",
  updated_at: null
};

describe("ProjectDetailScreen", () => {
  beforeEach(() => {
    jest.mocked(useProjectAccess).mockReturnValue({
      can: () => true,
      data: {
        permissions: [
          "project.delete",
          "project.members.read",
          "project.update"
        ]
      }
    } as never);
    jest.mocked(useLayoutMode).mockReturnValue({
      height: 844,
      isCompact: true,
      isExpanded: false,
      isMedium: false,
      mode: "compact",
      width: 390
    });
    jest.mocked(useProject).mockReturnValue({
      data: project,
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    jest.mocked(useClient).mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false
    } as never);
    jest.mocked(useSoftDeleteProject).mockReturnValue({
      isPending: false,
      mutateAsync: mockDelete
    } as never);
    jest.mocked(useAppToast).mockReturnValue({ show: mockShowToast });
    mockDelete.mockResolvedValue(undefined);
  });

  it("renders project progress and opens its photo gallery", async () => {
    await renderWithAppProviders(<ProjectDetailScreen />);

    expect(screen.getByText("River House")).toBeOnTheScreen();
    expect(screen.getByLabelText("Project progress 25%")).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText("photos"));

    expect(mockPush).toHaveBeenCalledWith("/projects/project-1/photos");
  });

  it("retries an unavailable project", async () => {
    jest.mocked(useProject).mockReturnValue({
      data: undefined,
      error: new Error("database details"),
      isError: true,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    await renderWithAppProviders(<ProjectDetailScreen />);

    expect(screen.getByText("Project unavailable")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Retry"));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("routes away from a missing project", async () => {
    jest.mocked(useProject).mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    await renderWithAppProviders(<ProjectDetailScreen />);

    expect(screen.getByText("Project not found")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Back to projects"));
    expect(mockReplace).toHaveBeenCalledWith("/projects");
  });

  it("requires confirmation before deleting a project", async () => {
    await renderWithAppProviders(<ProjectDetailScreen />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Project actions" })
    );
    await fireEvent.press(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete project?")).toBeOnTheScreen();
    expect(mockDelete).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("project-1");
      expect(mockReplace).toHaveBeenCalledWith("/projects");
    });
  });
});
