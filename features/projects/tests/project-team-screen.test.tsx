import {
  useInviteProjectMember,
  useLeaveProject,
  useProjectAccess,
  useProjectRoles,
  useProjectTeam,
  useRemoveProjectMember,
  useResendProjectInvitation,
  useRevokeProjectInvitation,
  useUpdateProjectMemberRole
} from "@/features/projects/hooks/use-project-collaboration";
import { ProjectTeamScreen } from "@/features/projects/screens/project-team-screen";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen } from "@testing-library/react-native";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace })
}));

jest.mock("@/features/projects/hooks/use-project-collaboration", () => ({
  useInviteProjectMember: jest.fn(),
  useLeaveProject: jest.fn(),
  useProjectAccess: jest.fn(),
  useProjectRoles: jest.fn(),
  useProjectTeam: jest.fn(),
  useRemoveProjectMember: jest.fn(),
  useResendProjectInvitation: jest.fn(),
  useRevokeProjectInvitation: jest.fn(),
  useUpdateProjectMemberRole: jest.fn()
}));

const mutation = {
  error: null,
  isError: false,
  isPending: false,
  mutate: jest.fn(),
  mutateAsync: jest.fn()
};

const teamPage = {
  hasMore: false,
  invitations: [
    {
      createdAt: "2026-07-28T10:00:00.000Z",
      deliveryStatus: "sent",
      email: "invitee@example.com",
      expiresAt: "2026-08-04T10:00:00.000Z",
      id: "30000000-0000-4000-8000-000000000001",
      lastSentAt: null,
      roleCode: "viewer",
      status: "pending"
    }
  ],
  members: [],
  nextPage: null,
  owner: {
    email: "owner@example.com",
    firstName: "Owner",
    id: "00000000-0000-4000-8000-000000000001",
    joinedAt: null,
    lastName: null,
    roleCode: "owner",
    userId: "00000000-0000-4000-8000-000000000001"
  }
};

describe("ProjectTeamScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useProjectRoles).mockReturnValue({
      data: [
        {
          code: "viewer",
          description: "Reads project information.",
          displayName: "Viewer",
          sortOrder: 30
        }
      ],
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn()
    } as never);
    jest.mocked(useProjectTeam).mockReturnValue({
      data: { pageParams: [0], pages: [teamPage] },
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
      refetch: jest.fn()
    } as never);
    jest.mocked(useInviteProjectMember).mockReturnValue(mutation as never);
    jest.mocked(useLeaveProject).mockReturnValue(mutation as never);
    jest.mocked(useRemoveProjectMember).mockReturnValue(mutation as never);
    jest.mocked(useResendProjectInvitation).mockReturnValue(mutation as never);
    jest.mocked(useRevokeProjectInvitation).mockReturnValue(mutation as never);
    jest.mocked(useUpdateProjectMemberRole).mockReturnValue(mutation as never);
  });

  it("shows finite feedback when the required project id is missing", async () => {
    await renderWithAppProviders(<ProjectTeamScreen />);

    expect(screen.getByText("Invalid project link")).toBeOnTheScreen();
    expect(
      screen.getByText("This project link is incomplete or invalid.")
    ).toBeOnTheScreen();
    expect(useProjectAccess).not.toHaveBeenCalled();
    expect(useProjectTeam).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText("Back to projects"));

    expect(mockReplace).toHaveBeenCalledWith("/projects");
  });

  it("renders management actions from capabilities, not the role name", async () => {
    jest.mocked(useProjectAccess).mockReturnValue({
      can: (permission: string) =>
        permission === "project.members.read" ||
        permission === "project.members.manage",
      data: { isOwner: true },
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn()
    } as never);

    await renderWithAppProviders(
      <ProjectTeamScreen projectId="10000000-0000-4000-8000-000000000001" />
    );

    expect(screen.getByText("Invite a member")).toBeOnTheScreen();
    expect(screen.getByText("Pending invitations")).toBeOnTheScreen();
    expect(screen.queryByText("Leave project")).not.toBeOnTheScreen();
  });

  it("keeps read-only members out of management controls", async () => {
    jest.mocked(useProjectAccess).mockReturnValue({
      can: (permission: string) => permission === "project.members.read",
      data: { isOwner: false },
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn()
    } as never);

    await renderWithAppProviders(
      <ProjectTeamScreen projectId="10000000-0000-4000-8000-000000000001" />
    );

    expect(screen.queryByText("Invite a member")).not.toBeOnTheScreen();
    expect(screen.queryByText("Pending invitations")).not.toBeOnTheScreen();
    expect(screen.getByText("Leave project")).toBeOnTheScreen();
  });
});
