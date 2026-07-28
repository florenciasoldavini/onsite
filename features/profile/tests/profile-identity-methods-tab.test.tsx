import { ProfileIdentityMethodsTab } from "@/features/profile/components/profile-identity-methods-tab";
import {
  useLinkProfileIdentity,
  useProfileUserIdentities
} from "@/features/profile/hooks/use-profile-avatar";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { Session } from "@supabase/supabase-js";

const mockSetParams = jest.fn();
const mockLink = jest.fn();
const mockRefetch = jest.fn();
const mockRouter = { setParams: mockSetParams };
const session = { user: { id: "owner-1" } } as Session;

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

jest.mock("@/features/profile/hooks/use-profile-avatar", () => ({
  useLinkProfileIdentity: jest.fn(),
  useProfileUserIdentities: jest.fn()
}));

jest.mock("@/infrastructure/supabase/client", () => ({
  getSupabaseErrorMessage: () => "We couldn't load sign-in methods."
}));

jest.mock("expo-image", () => ({
  Image: () => null
}));

describe("ProfileIdentityMethodsTab", () => {
  beforeEach(() => {
    jest.mocked(useProfileUserIdentities).mockReturnValue({
      data: [{ id: "email-1", provider: "email" }],
      error: null,
      isFetching: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    jest.mocked(useLinkProfileIdentity).mockReturnValue({
      isPending: false,
      mutateAsync: mockLink,
      variables: undefined
    } as never);
    mockLink.mockResolvedValue(undefined);
    mockRefetch.mockResolvedValue({
      data: [
        { id: "email-1", provider: "email" },
        { id: "google-1", provider: "google" }
      ],
      error: null
    });
  });

  it("links and confirms an OAuth identity", async () => {
    await renderWithAppProviders(
      <ProfileIdentityMethodsTab returnedLinkProvider={null} />,
      { auth: { session } }
    );

    await fireEvent.press(screen.getByLabelText("Link Google sign-in"));

    await waitFor(() => {
      expect(mockLink).toHaveBeenCalledWith("google");
      expect(screen.getByText("Google sign-in linked.")).toBeOnTheScreen();
    });
  });

  it("confirms a provider returned through the callback", async () => {
    await renderWithAppProviders(
      <ProfileIdentityMethodsTab returnedLinkProvider="google" />,
      { auth: { session } }
    );

    expect(
      await screen.findByText("Google sign-in linked.")
    ).toBeOnTheScreen();
    expect(mockSetParams).toHaveBeenCalledWith({
      identity_link_check: undefined
    });
  });
});
