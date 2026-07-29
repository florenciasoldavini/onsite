import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProjectInvitationPreview } from "@/features/projects/hooks/use-project-collaboration";
import { ProjectInvitationAcceptScreen } from "@/features/projects/screens/project-invitation-accept-screen";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace })
}));

jest.mock("@/features/auth/hooks/use-auth", () => ({
  useAuth: jest.fn()
}));

jest.mock("@/features/projects/hooks/use-project-collaboration", () => ({
  useProjectInvitationPreview: jest.fn()
}));

describe("ProjectInvitationAcceptScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue({ session: null } as never);
    jest.mocked(useProjectInvitationPreview).mockReturnValue({
      data: {
        expiresAt: "2026-08-04T10:00:00.000Z",
        id: "30000000-0000-4000-8000-000000000001",
        inviterName: "Owner Person",
        projectName: "River House",
        roleCode: "viewer",
        roleName: "Viewer",
        status: "pending"
      },
      isError: false,
      isLoading: false
    } as never);
  });

  it("preserves the invitation inbox destination through sign in", async () => {
    await renderWithAppProviders(
      <ProjectInvitationAcceptScreen token="secure-invitation-token-value-12345" />
    );

    fireEvent.press(screen.getByText("Sign in"));

    expect(mockPush).toHaveBeenCalledWith(
      "/sign-in?next=%2Finvitations%3Finvitation%3D30000000-0000-4000-8000-000000000001"
    );
  });

  it("does not offer acceptance for an expired invitation", async () => {
    jest.mocked(useProjectInvitationPreview).mockReturnValue({
      data: {
        expiresAt: "2026-07-20T10:00:00.000Z",
        id: "30000000-0000-4000-8000-000000000001",
        inviterName: "Owner Person",
        projectName: "River House",
        roleCode: "viewer",
        roleName: "Viewer",
        status: "expired"
      },
      isError: false,
      isLoading: false
    } as never);

    await renderWithAppProviders(
      <ProjectInvitationAcceptScreen token="secure-invitation-token-value-12345" />
    );

    expect(screen.getByText("This invitation is expired.")).toBeOnTheScreen();
    expect(screen.queryByText("Sign in")).not.toBeOnTheScreen();
  });
});
