import {
  beginOAuthSignIn,
  getCurrentAuthSession,
  observeAuthSession,
  signOutAuthSession,
  signInWithEmailPassword,
  signUpWithEmailPassword
} from "@/features/auth/repositories/auth.repository";

const mockAuth = {
  getSession: jest.fn(),
  getAuthRedirectUrl: jest.fn(() => "https://onzait.test/callback"),
  onAuthStateChange: jest.fn(),
  signOut: jest.fn(),
  signInWithOAuth: jest.fn(),
  signInWithPassword: jest.fn(),
  signUp: jest.fn()
};

jest.mock("@/features/auth/repositories/auth-transport.repository", () => ({
  clearWebAuthUrlArtifacts: jest.fn(),
  completeAuthSessionFromUrl: jest.fn(),
  getActiveAuthUrl: jest.fn(),
  getAuthParamsFromUrl: jest.fn(),
  get getAuthRedirectUrl() {
    return mockAuth.getAuthRedirectUrl;
  },
  resendSignUpConfirmationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  get startOAuthSignIn() {
    return mockAuth.signInWithOAuth;
  },
  updatePassword: jest.fn(),
  urlHasAuthPayload: jest.fn()
}));

jest.mock("@/infrastructure/supabase/client", () => ({
  getSupabaseErrorMessage: (error: unknown) =>
    error instanceof Error && error.message === "unconfirmed"
      ? "Confirm your email address before signing in."
      : "We couldn't complete this request. Please try again.",
  isSupabaseEmailCooldownError: (error: unknown) =>
    error instanceof Error && error.message === "cooldown",
  isSupabaseEmailNotConfirmedError: (error: unknown) =>
    error instanceof Error && error.message === "unconfirmed",
  supabase: {
    auth: {
      get getSession() {
        return mockAuth.getSession;
      },
      get onAuthStateChange() {
        return mockAuth.onAuthStateChange;
      },
      get signOut() {
        return mockAuth.signOut;
      },
      get signInWithPassword() {
        return mockAuth.signInWithPassword;
      },
      get signUp() {
        return mockAuth.signUp;
      }
    }
  }
}));

describe("auth repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("owns the Supabase password sign-in request", async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: "token" } },
      error: null
    });

    await signInWithEmailPassword({
      email: "user@example.com",
      password: "secret"
    });

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret"
    });
  });

  it("classifies unconfirmed email errors at the transport boundary", async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: new Error("unconfirmed")
    });

    await expect(
      signInWithEmailPassword({
        email: "user@example.com",
        password: "secret"
      })
    ).rejects.toMatchObject({
      code: "email-not-confirmed",
      message: "Confirm your email address before signing in."
    });
  });

  it("owns sign-up redirect configuration", async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { session: null },
      error: null
    });

    await signUpWithEmailPassword({
      email: "user@example.com",
      password: "secret"
    });

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret",
      options: {
        emailRedirectTo: "https://onzait.test/callback"
      }
    });
  });

  it("normalizes OAuth transport failures", async () => {
    mockAuth.signInWithOAuth.mockRejectedValue(new Error("oauth failed"));

    await expect(beginOAuthSignIn("google")).rejects.toMatchObject({
      code: "unknown",
      message: "We couldn't complete this request. Please try again."
    });
  });

  it("owns session restoration, observation, and sign-out transport", async () => {
    const session = { access_token: "token" };
    const unsubscribe = jest.fn();
    const listener = jest.fn();
    mockAuth.getSession.mockResolvedValue({
      data: { session },
      error: null
    });
    mockAuth.onAuthStateChange.mockImplementation((callback) => {
      callback("SIGNED_IN", session);
      return { data: { subscription: { unsubscribe } } };
    });
    mockAuth.signOut.mockResolvedValue({ error: null });

    await expect(getCurrentAuthSession()).resolves.toEqual(session);
    const stopObserving = observeAuthSession(listener);
    await expect(signOutAuthSession()).resolves.toBeUndefined();

    expect(listener).toHaveBeenCalledWith(session);
    stopObserving();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
