import {
  useCreateProject,
  useProject,
  useUpdateProject
} from "@/features/projects/hooks/use-projects";
import { ProjectFormScreen } from "@/features/projects/screens/project-form-screen";
import { useProjectAccess } from "@/features/projects/hooks/use-project-collaboration";
import type { ProjectSaveOutcome } from "@/features/projects/types/project.types";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { Session } from "@supabase/supabase-js";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRefetch = jest.fn();
const mockShowToast = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace })
}));

jest.mock("@/features/projects/hooks/use-projects", () => ({
  useCreateProject: jest.fn(),
  useProject: jest.fn(),
  useUpdateProject: jest.fn()
}));

jest.mock("@/features/projects/hooks/use-project-collaboration", () => ({
  useProjectAccess: jest.fn()
}));

jest.mock("@/shared/hooks/use-layout-mode", () => ({
  useLayoutMode: jest.fn()
}));

jest.mock("@/shared/ui/components/toast", () => ({
  useAppToast: jest.fn()
}));

jest.mock("@/features/projects/components/project-address-field", () => {
  const React = jest.requireActual("react");
  const { Pressable, Text } = jest.requireActual("react-native");

  return {
    ProjectAddressField: ({
      onChange
    }: {
      onChange: (value: unknown) => void;
    }) =>
      React.createElement(
        Pressable,
        {
          accessibilityLabel: "Choose test address",
          accessibilityRole: "button",
          onPress: () =>
            onChange({
              address: "1 Site Road",
              latitude: -34.6,
              longitude: -58.4,
              placeId: "place-1"
            })
        },
        React.createElement(Text, null, "Choose address")
      )
  };
});

jest.mock("@/features/clients/components/client-picker-field", () => ({
  ClientPickerField: () => null
}));

jest.mock("@/features/projects/components/project-cover-picker", () => ({
  ProjectCoverPicker: () => null
}));

jest.mock("@/features/projects/components/project-form-calendar-field", () => ({
  ProjectFormCalendarField: () => null
}));

const outcome: ProjectSaveOutcome = {
  coverStatus: "not-requested",
  project: {
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
    id: "project-1",
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
  }
};

describe("ProjectFormScreen", () => {
  beforeEach(() => {
    jest.mocked(useProjectAccess).mockReturnValue({
      can: () => true,
      data: {
        permissions: [
          "project.change_client",
          "project.cover.write",
          "project.update"
        ]
      },
      isError: false,
      isLoading: false,
      refetch: jest.fn()
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
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    jest.mocked(useCreateProject).mockReturnValue({
      isPending: false,
      mutateAsync: mockCreate
    } as never);
    jest.mocked(useUpdateProject).mockReturnValue({
      isPending: false,
      mutateAsync: mockUpdate
    } as never);
    jest.mocked(useAppToast).mockReturnValue({ show: mockShowToast });
    mockCreate.mockResolvedValue(outcome);
  });

  it("requires an authenticated session before creating a project", async () => {
    await renderWithAppProviders(<ProjectFormScreen mode="create" />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Foundation Package"),
      "River House"
    );
    await fireEvent.press(screen.getByLabelText("Choose test address"));
    await fireEvent.press(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("You must be signed in to save projects.")
    ).toBeOnTheScreen();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a valid project and routes to its detail", async () => {
    await renderWithAppProviders(<ProjectFormScreen mode="create" />, {
      auth: { session: { user: { id: "owner-1" } } as Session }
    });

    await fireEvent.changeText(
      screen.getByPlaceholderText("Foundation Package"),
      "River House"
    );
    await fireEvent.press(screen.getByLabelText("Choose test address"));
    await fireEvent.press(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        coverAsset: null,
        input: expect.objectContaining({
          address: "1 Site Road",
          name: "River House"
        })
      });
      expect(mockReplace).toHaveBeenCalledWith("/projects/project-1");
      expect(mockShowToast).toHaveBeenCalledWith({
        description: "River House was created successfully.",
        title: "Project created",
        tone: "success"
      });
    });
  });

  it("shows retry and not-found states for edit targets", async () => {
    jest.mocked(useProject).mockReturnValue({
      data: undefined,
      error: new Error("database details"),
      isError: true,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    await renderWithAppProviders(
      <ProjectFormScreen mode="edit" projectId="project-1" />
    );

    expect(screen.getByText("Project unavailable")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Retry"));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("blocks direct edit navigation when the project is readable but editing is forbidden", async () => {
    jest.mocked(useProject).mockReturnValue({
      data: outcome.project,
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    jest.mocked(useProjectAccess).mockReturnValue({
      can: () => false,
      data: { permissions: ["project.read"] },
      isError: false,
      isLoading: false,
      refetch: jest.fn()
    } as never);

    await renderWithAppProviders(
      <ProjectFormScreen mode="edit" projectId="project-1" />
    );

    expect(screen.getByText("Project editing unavailable")).toBeOnTheScreen();
    expect(
      screen.getByText("You don't have permission to edit this project.")
    ).toBeOnTheScreen();
    expect(
      screen.queryByPlaceholderText("Foundation Package")
    ).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Back to project"));

    expect(mockReplace).toHaveBeenCalledWith("/projects/project-1");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
