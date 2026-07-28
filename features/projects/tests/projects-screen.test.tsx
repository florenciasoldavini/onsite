import { useProjects } from "@/features/projects/hooks/use-projects";
import ProjectsScreen from "@/features/projects/screens/projects-screen";
import type { ProjectSummary } from "@/features/projects/types/project.types";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { renderWithAppProviders } from "@/tests/support/render";
import { userEvent } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockRefetch = jest.fn();
const mockFetchNextPage = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

jest.mock("@/features/projects/hooks/use-projects", () => ({
  useProjects: jest.fn()
}));

jest.mock("@/shared/hooks/use-layout-mode", () => ({
  useLayoutMode: jest.fn()
}));

jest.mock("@/features/projects/components/project-card", () => {
  const React = jest.requireActual("react");
  const { Pressable, Text } = jest.requireActual("react-native");

  return {
    ProjectCard: ({
      onPress,
      project
    }: {
      onPress: () => void;
      project: ProjectSummary;
    }) =>
      React.createElement(
        Pressable,
        {
          accessibilityLabel: `Open ${project.name}`,
          accessibilityRole: "button",
          onPress
        },
        React.createElement(Text, null, project.name)
      )
  };
});

jest.mock("@/features/projects/components/project-card-skeleton", () => {
  const React = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");

  return {
    ProjectCardSkeleton: () =>
      React.createElement(Text, null, "project-loading")
  };
});

jest.mock("@/features/projects/components/projects-table", () => {
  const React = jest.requireActual("react");
  const { Pressable, Text, View } = jest.requireActual("react-native");

  return {
    ProjectsTable: ({
      onOpenProject,
      projects
    }: {
      onOpenProject: (project: ProjectSummary) => void;
      projects: ProjectSummary[];
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, "projects-table"),
        ...projects.map((project) =>
          React.createElement(
            Pressable,
            {
              accessibilityLabel: `Open table ${project.name}`,
              accessibilityRole: "button",
              key: project.id,
              onPress: () => onOpenProject(project)
            },
            React.createElement(Text, null, project.name)
          )
        )
      ),
    ProjectsTableSkeleton: () =>
      React.createElement(Text, null, "projects-table-loading")
  };
});

const project: ProjectSummary = {
  address: "1 Site Road",
  cover_image_path: null,
  estimated_end_date: null,
  id: "project-1",
  latitude: -34.6,
  longitude: -58.4,
  name: "River House",
  phase: "concept",
  progress_percentage: 0,
  project_type: "new_build",
  status: "planned"
};

function setLayout(mode: "compact" | "expanded" | "medium") {
  jest.mocked(useLayoutMode).mockReturnValue({
    height: 844,
    isCompact: mode === "compact",
    isExpanded: mode === "expanded",
    isMedium: mode === "medium",
    mode,
    width: mode === "compact" ? 390 : mode === "medium" ? 900 : 1440
  });
}

function mockProjectsQuery(
  overrides: Partial<ReturnType<typeof useProjects>> = {}
) {
  jest.mocked(useProjects).mockReturnValue({
    data: { pageParams: [0], pages: [{ items: [], nextOffset: null }] },
    error: null,
    fetchNextPage: mockFetchNextPage,
    hasNextPage: false,
    isError: false,
    isFetchNextPageError: false,
    isFetchingNextPage: false,
    isLoading: false,
    refetch: mockRefetch,
    ...overrides
  } as never);
}

describe("ProjectsScreen", () => {
  beforeEach(() => {
    setLayout("medium");
    mockProjectsQuery();
  });

  it("shows an actionable query error", async () => {
    const user = userEvent.setup();
    mockProjectsQuery({
      data: undefined,
      error: new Error("provider details"),
      isError: true
    });
    const view = await renderWithAppProviders(<ProjectsScreen />);

    expect(view.getByText("Projects unavailable")).toBeOnTheScreen();
    await user.press(view.getByRole("button", { name: "Retry" }));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("opens project creation from the empty state", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<ProjectsScreen />);

    expect(view.getByText("No projects yet")).toBeOnTheScreen();
    await user.press(view.getByRole("button", { name: "New Project" }));

    expect(mockPush).toHaveBeenCalledWith("/projects/new");
  });

  it("renders compact project cards, pagination, and the floating action", async () => {
    const user = userEvent.setup();
    setLayout("compact");
    mockProjectsQuery({
      data: {
        pageParams: [0],
        pages: [{ items: [project], nextOffset: 24 }]
      },
      hasNextPage: true
    });
    const view = await renderWithAppProviders(<ProjectsScreen />);

    await user.press(view.getByRole("button", { name: "Open River House" }));
    expect(mockPush).toHaveBeenCalledWith("/projects/project-1");

    await user.press(view.getByRole("button", { name: "Load more projects" }));
    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);

    await user.press(view.getByRole("button", { name: "New project" }));
    expect(mockPush).toHaveBeenCalledWith("/projects/new");
  });

  it("uses the table and header creation action in expanded layouts", async () => {
    const user = userEvent.setup();
    setLayout("expanded");
    mockProjectsQuery({
      data: {
        pageParams: [0],
        pages: [{ items: [project], nextOffset: null }]
      }
    });
    const view = await renderWithAppProviders(<ProjectsScreen />);

    expect(view.getByText("projects-table")).toBeOnTheScreen();
    await user.press(
      view.getByRole("button", { name: "Open table River House" })
    );
    expect(mockPush).toHaveBeenCalledWith("/projects/project-1");

    await user.press(view.getByRole("button", { name: "New project" }));
    expect(mockPush).toHaveBeenCalledWith("/projects/new");
  });

  it("passes the user's search text to the project query", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<ProjectsScreen />);

    await user.type(view.getByPlaceholderText("Search projects"), "river");

    expect(useProjects).toHaveBeenLastCalledWith({
      buildingTypes: [],
      phases: [],
      projectTypes: [],
      query: "river",
      sort: "created_desc",
      statuses: []
    });
  });
});
