import {
  useMyProjectInvitations,
  useRespondProjectInvitation
} from "@/features/projects/hooks/use-project-collaboration";
import { ProjectInvitationsScreen } from "@/features/projects/screens/project-invitations-screen";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockRespond = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace })
}));

jest.mock("@/features/projects/hooks/use-project-collaboration", () => ({
  useMyProjectInvitations: jest.fn(),
  useRespondProjectInvitation: jest.fn()
}));

describe("ProjectInvitationsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useMyProjectInvitations).mockReturnValue({
      data: {
        pageParams: [0],
        pages: [
          {
            hasMore: false,
            items: [
              {
                createdAt: "2026-07-28T10:00:00.000Z",
                expiresAt: "2026-08-04T10:00:00.000Z",
                id: "30000000-0000-4000-8000-000000000001",
                inviterName: "Owner Person",
                projectId: "10000000-0000-4000-8000-000000000001",
                projectName: "River House",
                roleCode: "contributor"
              }
            ],
            nextPage: null
          }
        ]
      },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false
    } as never);
    jest.mocked(useRespondProjectInvitation).mockReturnValue({
      error: null,
      isError: false,
      isPending: false,
      mutateAsync: mockRespond
    } as never);
  });

  it("accepts an invitation and opens the shared project", async () => {
    mockRespond.mockResolvedValue({ status: "accepted" });
    await renderWithAppProviders(<ProjectInvitationsScreen />);

    fireEvent.press(screen.getByText("Accept"));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/projects/10000000-0000-4000-8000-000000000001"
      )
    );
    expect(mockRespond).toHaveBeenCalledWith({
      invitationId: "30000000-0000-4000-8000-000000000001",
      response: "accept"
    });
  });
});
