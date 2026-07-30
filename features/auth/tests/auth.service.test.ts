import { AuthRepositoryError } from "@/features/auth/errors/auth.errors";
import {
  AuthCallbackError,
  finishAuthCallback,
  preparePasswordRecovery,
  resendEmailVerification,
  signInWithEmail,
  signUpWithEmail
} from "@/features/auth/services/auth.service";

const mockRepository = {
  clearCompletedWebAuthCallback: jest.fn(),
  completeAuthCallback: jest.fn(),
  getAuthCallbackUrl: jest.fn(),
  hasAuthCallbackPayload: jest.fn(),
  parseAuthCallbackParams: jest.fn(),
  resendVerificationEmail: jest.fn(),
  signInWithEmailPassword: jest.fn(),
  signUpWithEmailPassword: jest.fn()
};

jest.mock("@/features/auth/repositories/auth.repository", () => ({
  beginOAuthSignIn: jest.fn(),
  changePassword: jest.fn(),
  requestPasswordReset: jest.fn(),
  get clearCompletedWebAuthCallback() {
    return mockRepository.clearCompletedWebAuthCallback;
  },
  get completeAuthCallback() {
    return mockRepository.completeAuthCallback;
  },
  get getAuthCallbackUrl() {
    return mockRepository.getAuthCallbackUrl;
  },
  get hasAuthCallbackPayload() {
    return mockRepository.hasAuthCallbackPayload;
  },
  get parseAuthCallbackParams() {
    return mockRepository.parseAuthCallbackParams;
  },
  get resendVerificationEmail() {
    return mockRepository.resendVerificationEmail;
  },
  get signInWithEmailPassword() {
    return mockRepository.signInWithEmailPassword;
  },
  get signUpWithEmailPassword() {
    return mockRepository.signUpWithEmailPassword;
  }
}));

describe("auth service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes email before signing in", async () => {
    mockRepository.signInWithEmailPassword.mockResolvedValue({
      session: { access_token: "token" }
    });

    await expect(
      signInWithEmail({ email: "  BUILDER@EXAMPLE.COM ", password: "secret" })
    ).resolves.toEqual({ status: "signed-in" });
    expect(mockRepository.signInWithEmailPassword).toHaveBeenCalledWith({
      email: "builder@example.com",
      password: "secret"
    });
  });

  it("returns a verification outcome for an unconfirmed sign-in", async () => {
    mockRepository.signInWithEmailPassword.mockRejectedValue(
      new AuthRepositoryError("Email not confirmed", "email-not-confirmed")
    );

    await expect(
      signInWithEmail({ email: "USER@example.com", password: "secret" })
    ).resolves.toEqual({
      email: "user@example.com",
      status: "email-unverified"
    });
  });

  it("returns a verification-sent outcome when sign-up has no session", async () => {
    mockRepository.signUpWithEmailPassword.mockResolvedValue({
      session: null
    });

    await expect(
      signUpWithEmail({ email: "USER@example.com", password: "secret" })
    ).resolves.toEqual({
      email: "user@example.com",
      status: "verification-sent"
    });
  });

  it("returns a rate-limited outcome for sign-up cooldowns", async () => {
    mockRepository.signUpWithEmailPassword.mockRejectedValue(
      new AuthRepositoryError("Wait before retrying", "email-cooldown")
    );

    await expect(
      signUpWithEmail({ email: "user@example.com", password: "secret" })
    ).resolves.toEqual({
      email: "user@example.com",
      status: "verification-rate-limited"
    });
  });

  it("represents verification resend cooldowns without leaking provider errors", async () => {
    mockRepository.resendVerificationEmail.mockRejectedValue(
      new AuthRepositoryError("Wait before retrying", "email-cooldown")
    );

    await expect(resendEmailVerification("USER@example.com")).resolves.toEqual({
      status: "rate-limited"
    });
    expect(mockRepository.resendVerificationEmail).toHaveBeenCalledWith(
      "user@example.com",
      "es"
    );
  });

  it("prepares a password update only from a recovery payload", async () => {
    mockRepository.getAuthCallbackUrl.mockReturnValue("onzait://reset");
    mockRepository.hasAuthCallbackPayload.mockReturnValue(true);
    mockRepository.completeAuthCallback.mockResolvedValue({
      session: null,
      type: "recovery"
    });

    await expect(preparePasswordRecovery("onzait://reset")).resolves.toEqual({
      shouldUpdatePassword: true
    });
    expect(mockRepository.clearCompletedWebAuthCallback).toHaveBeenCalledTimes(
      1
    );
  });

  it("rejects callback URLs without an auth payload and preserves link intent", async () => {
    mockRepository.getAuthCallbackUrl.mockReturnValue(
      "https://onzait.test/callback?auth_action=identity-link&provider=google"
    );
    mockRepository.parseAuthCallbackParams.mockReturnValue(
      new URLSearchParams("auth_action=identity-link&provider=google")
    );
    mockRepository.hasAuthCallbackPayload.mockReturnValue(false);

    const completion = finishAuthCallback(null);

    await expect(completion).rejects.toBeInstanceOf(AuthCallbackError);
    await expect(completion).rejects.toMatchObject({
      intent: { kind: "identity-link", provider: "google" }
    });
  });

  it("completes auth callbacks and returns the safe destination", async () => {
    mockRepository.getAuthCallbackUrl.mockReturnValue(
      "https://onzait.test/callback?code=abc&next=%2Fprojects"
    );
    mockRepository.parseAuthCallbackParams.mockReturnValue(
      new URLSearchParams("code=abc&next=%2Fprojects")
    );
    mockRepository.hasAuthCallbackPayload.mockReturnValue(true);
    mockRepository.completeAuthCallback.mockResolvedValue({
      session: { access_token: "token" },
      type: null
    });

    await expect(finishAuthCallback(null)).resolves.toEqual({
      intent: { kind: "sign-in" },
      redirectPath: "/projects"
    });
    expect(mockRepository.clearCompletedWebAuthCallback).toHaveBeenCalledTimes(
      1
    );
  });
});
