import {
  startOAuthIdentityLink,
  startOAuthSignIn
} from "@/features/auth/repositories/auth-transport.repository";

const mocks = {
  linkIdentity: jest.fn(),
  openAuthSessionAsync: jest.fn(),
  signInWithOAuth: jest.fn()
};

jest.mock("@/infrastructure/supabase/client", () => ({
  getSupabaseErrorMessage: () =>
    "We couldn't complete this request. Please try again.",
  supabase: {
    auth: {
      get linkIdentity() {
        return mocks.linkIdentity;
      },
      get signInWithOAuth() {
        return mocks.signInWithOAuth;
      }
    }
  }
}));

jest.mock("expo-constants", () => ({
  default: { executionEnvironment: "standalone" },
  ExecutionEnvironment: { StoreClient: "store-client" }
}));

jest.mock("expo-linking", () => ({
  createURL: jest.fn((path: string) => `onzait://${path}`)
}));

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  get openAuthSessionAsync() {
    return mocks.openAuthSessionAsync;
  }
}));

jest.mock("react-native", () => ({
  Platform: { OS: "ios" }
}));

describe("native OAuth product errors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not expose Supabase response details when sign-in cannot start", async () => {
    mocks.signInWithOAuth.mockResolvedValue({ data: {}, error: null });

    await expect(startOAuthSignIn("google")).rejects.toMatchObject({
      message: "We couldn't start Google sign-in. Try again."
    });
  });

  it("represents a canceled sign-in without redirect configuration advice", async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: "https://provider.example/auth" },
      error: null
    });
    mocks.openAuthSessionAsync.mockResolvedValue({ type: "cancel" });

    await expect(startOAuthSignIn("apple")).rejects.toMatchObject({
      message: "Apple sign-in was canceled."
    });
  });

  it("keeps identity-link redirect diagnostics out of product copy", async () => {
    mocks.linkIdentity.mockResolvedValue({
      data: { url: "https://provider.example/auth" },
      error: null
    });
    mocks.openAuthSessionAsync.mockResolvedValue({ type: "locked" });

    await expect(startOAuthIdentityLink("google")).rejects.toMatchObject({
      message: "We couldn't finish linking your Google account. Try again."
    });
  });
});
