import { useAuth } from "@/features/auth/hooks/use-auth";
import { AuthProvider } from "@/features/auth/providers/auth-provider";
import {
  deliverWelcomeEmailIfNeeded,
  hydrateAuthUser,
  loadCurrentAuthSession,
  logOutCurrentSession,
  subscribeToAuthSession
} from "@/features/auth/services/auth-session.service";
import type { User } from "@/features/auth/types/auth.types";
import {
  act,
  fireEvent,
  waitFor
} from "@testing-library/react-native";
import { renderWithAppProviders as render } from "@/tests/support/render";
import type { Session } from "@supabase/supabase-js";
import { Pressable, Text } from "react-native";

jest.mock("@/features/auth/services/auth-session.service", () => ({
  createAuthUser: jest.fn(),
  deliverWelcomeEmailIfNeeded: jest.fn(),
  hasAuthSessionSupport: jest.fn(() => true),
  hydrateAuthUser: jest.fn(),
  loadCurrentAuthSession: jest.fn(),
  logOutCurrentSession: jest.fn(),
  subscribeToAuthSession: jest.fn(),
  updateAuthenticatedUserProfile: jest.fn()
}));

jest.mock("@/infrastructure/monitoring/sentry", () => ({
  Sentry: {
    captureException: jest.fn(),
    setTag: jest.fn(),
    setUser: jest.fn()
  }
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

const session = {
  user: {
    email: user.email,
    id: user.id
  }
} as Session;

let sessionListener: ((nextSession: Session | null) => void) | null = null;
const mockUnsubscribe = jest.fn();

function AuthProbe() {
  const {
    authError,
    isLoading,
    logOut,
    session: currentSession,
    user: currentUser
  } = useAuth();

  return (
    <>
      <Text>{isLoading ? "loading" : "ready"}</Text>
      <Text>{currentSession ? "authenticated" : "anonymous"}</Text>
      <Text>{currentUser?.email ?? "no-profile"}</Text>
      <Text>{authError ?? "no-error"}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void logOut();
        }}
      >
        <Text>Log out</Text>
      </Pressable>
    </>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    jest.mocked(deliverWelcomeEmailIfNeeded).mockResolvedValue(user);
    jest.mocked(hydrateAuthUser).mockResolvedValue(user);
    jest.mocked(loadCurrentAuthSession).mockResolvedValue(session);
    jest.mocked(logOutCurrentSession).mockResolvedValue(undefined);
    jest.mocked(subscribeToAuthSession).mockImplementation((listener) => {
      sessionListener = listener;
      return mockUnsubscribe;
    });
    sessionListener = null;
  });

  it("hydrates the current session and exposes the authenticated profile", async () => {
    const view = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(view.getByText("ready")).toBeOnTheScreen();
      expect(view.getByText("authenticated")).toBeOnTheScreen();
      expect(view.getByText(user.email)).toBeOnTheScreen();
    });
    expect(hydrateAuthUser).toHaveBeenCalledWith(session);
  });

  it("reacts to sign-in and sign-out events from the session subscription", async () => {
    jest.mocked(loadCurrentAuthSession).mockResolvedValue(null);
    const view = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(view.getByText("ready")).toBeOnTheScreen();
      expect(view.getByText("anonymous")).toBeOnTheScreen();
    });

    await act(async () => {
      sessionListener?.(session);
    });

    await waitFor(() => {
      expect(view.getByText("authenticated")).toBeOnTheScreen();
      expect(view.getByText(user.email)).toBeOnTheScreen();
    });

    await act(async () => {
      sessionListener?.(null);
    });

    await waitFor(() => {
      expect(view.getByText("anonymous")).toBeOnTheScreen();
      expect(view.getByText("no-profile")).toBeOnTheScreen();
    });
  });

  it("presents a safe error when the stored session cannot be restored", async () => {
    jest
      .mocked(loadCurrentAuthSession)
      .mockRejectedValue(new Error("provider details"));
    const view = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(view.getByText("ready")).toBeOnTheScreen();
      expect(
        view.getByText(
          "We couldn't restore your session. Sign in and try again."
        )
      ).toBeOnTheScreen();
    });
    expect(view.getByText("anonymous")).toBeOnTheScreen();
  });

  it("clears local authentication state after logout", async () => {
    const view = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(view.getByText("authenticated")).toBeOnTheScreen();
    });
    await fireEvent.press(view.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(logOutCurrentSession).toHaveBeenCalledTimes(1);
      expect(view.getByText("anonymous")).toBeOnTheScreen();
      expect(view.getByText("no-profile")).toBeOnTheScreen();
    });
  });
});
