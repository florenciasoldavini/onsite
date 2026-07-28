import ProfileScreen from "@/features/profile/screens/profile-screen";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { renderWithAppProviders } from "@/tests/support/render";
import { userEvent } from "@testing-library/react-native";
import type { Session } from "@supabase/supabase-js";

const mockLogOut = jest.fn();
let mockSearchParams: { identity_link_check?: string | string[] } = {};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockSearchParams
}));

jest.mock("@/shared/hooks/use-layout-mode", () => ({
  useLayoutMode: jest.fn()
}));

jest.mock("@/features/profile/components/profile-info-tab", () => {
  const React = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");

  return {
    ProfileInfoTab: () =>
      React.createElement(Text, null, "profile-panel")
  };
});

jest.mock("@/features/profile/components/profile-security-tab", () => {
  const React = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");

  return {
    ProfileSecurityTab: () =>
      React.createElement(Text, null, "security-panel")
  };
});

jest.mock(
  "@/features/profile/components/profile-identity-methods-tab",
  () => {
    const React = jest.requireActual("react");
    const { Text } = jest.requireActual("react-native");

    return {
      ProfileIdentityMethodsTab: ({
        returnedLinkProvider
      }: {
        returnedLinkProvider: string | null;
      }) =>
        React.createElement(
          Text,
          null,
          `methods-panel-${returnedLinkProvider ?? "none"}`
        )
    };
  }
);

const session = {
  user: {
    email: "owner@example.com",
    id: "owner-1"
  }
} as Session;

function setLayout(mode: "compact" | "expanded") {
  jest.mocked(useLayoutMode).mockReturnValue({
    height: 844,
    isCompact: mode === "compact",
    isExpanded: mode === "expanded",
    isMedium: false,
    mode,
    width: mode === "compact" ? 390 : 1440
  });
}

describe("ProfileScreen", () => {
  beforeEach(() => {
    mockSearchParams = {};
    setLayout("compact");
  });

  it("switches compact profile tabs and logs out", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<ProfileScreen />, {
      auth: { logOut: mockLogOut, session }
    });

    expect(view.getByRole("button", { name: "Profile" })).toBeSelected();
    await user.press(view.getByRole("button", { name: "Security" }));
    expect(view.getByRole("button", { name: "Security" })).toBeSelected();

    await user.press(view.getByRole("button", { name: "Log Out" }));

    expect(mockLogOut).toHaveBeenCalledTimes(1);
  });

  it("uses sidebar tabs in expanded layouts", async () => {
    const user = userEvent.setup();
    setLayout("expanded");
    const view = await renderWithAppProviders(<ProfileScreen />, {
      auth: { logOut: mockLogOut, session }
    });

    expect(view.getByRole("tab", { name: "Profile" })).toBeSelected();
    await user.press(view.getByRole("tab", { name: "Sign-In" }));
    expect(view.getByRole("tab", { name: "Sign-In" })).toBeSelected();
  });

  it("opens sign-in methods after returning from an identity-link callback", async () => {
    mockSearchParams = { identity_link_check: "google" };
    const view = await renderWithAppProviders(<ProfileScreen />, {
      auth: { session }
    });

    expect(
      await view.findByRole("button", { name: "Sign-In" })
    ).toBeSelected();
    expect(view.getByText("methods-panel-google")).toBeOnTheScreen();
  });
});
