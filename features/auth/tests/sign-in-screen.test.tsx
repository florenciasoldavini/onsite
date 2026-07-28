import SignInScreen from "@/features/auth/screens/sign-in-screen";
import {
  useEmailSignIn,
  useOAuthSignIn
} from "@/features/auth/hooks/use-auth-mutations";
import { renderWithAppProviders } from "@/tests/support/render";
import { userEvent, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockEmailSignIn = jest.fn();
const mockOAuthSignIn = jest.fn();

jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router");

  return {
    ...actual,
    useRouter: () => ({
      back: jest.fn(),
      replace: mockReplace
    })
  };
});

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useEmailSignIn: jest.fn(),
  useOAuthSignIn: jest.fn()
}));

describe("SignInScreen", () => {
  beforeEach(() => {
    jest.mocked(useEmailSignIn).mockReturnValue({
      mutateAsync: mockEmailSignIn
    } as never);
    jest.mocked(useOAuthSignIn).mockReturnValue({
      mutateAsync: mockOAuthSignIn
    } as never);
    mockEmailSignIn.mockResolvedValue({ status: "authenticated" });
    mockOAuthSignIn.mockResolvedValue(undefined);
  });

  it("reveals validation errors without submitting an incomplete form", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<SignInScreen />);

    await user.press(view.getByText("Sign In"));

    expect(await view.findByText("Invalid email address")).toBeOnTheScreen();
    expect(view.getByText("Password is required")).toBeOnTheScreen();
    expect(mockEmailSignIn).not.toHaveBeenCalled();
  });

  it("submits credentials after the required fields are valid", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<SignInScreen />);

    await user.type(
      view.getByPlaceholderText("architect@onzait.com"),
      "builder@example.com"
    );
    await user.type(
      view.getByPlaceholderText("••••••••••••"),
      "secret"
    );

    await user.press(view.getByRole("button", { name: "Sign In" }));
    await waitFor(() => {
      expect(mockEmailSignIn).toHaveBeenCalledWith({
        email: "builder@example.com",
        password: "secret"
      });
    });
  });

  it("routes unverified accounts to the verification screen", async () => {
    const user = userEvent.setup();
    mockEmailSignIn.mockResolvedValue({
      email: "crew+site@example.com",
      status: "email-unverified"
    });
    const view = await renderWithAppProviders(<SignInScreen />);

    await user.type(
      view.getByPlaceholderText("architect@onzait.com"),
      "crew+site@example.com"
    );
    await user.type(
      view.getByPlaceholderText("••••••••••••"),
      "secret"
    );
    await user.press(view.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/verify-email?email=crew%2Bsite%40example.com"
      );
    });
  });

  it("shows a safe fallback when email sign-in fails", async () => {
    const user = userEvent.setup();
    mockEmailSignIn.mockRejectedValue(new Error("provider details"));
    const view = await renderWithAppProviders(<SignInScreen />);

    await user.type(
      view.getByPlaceholderText("architect@onzait.com"),
      "builder@example.com"
    );
    await user.type(
      view.getByPlaceholderText("••••••••••••"),
      "secret"
    );
    await user.press(view.getByRole("button", { name: "Sign In" }));

    expect(
      await view.findByText(
        "We couldn't sign you in. Check your details and try again."
      )
    ).toBeOnTheScreen();
  });

  it("starts the selected OAuth provider", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<SignInScreen />);

    await user.press(view.getByLabelText("Continue with Google"));

    await waitFor(() => {
      expect(mockOAuthSignIn).toHaveBeenCalledWith("google");
    });
  });
});
