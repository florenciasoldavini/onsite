import {
  useEmailSignUp,
  useOAuthSignIn
} from "@/features/auth/hooks/use-auth-mutations";
import SignUpScreen from "@/features/auth/screens/sign-up-screen";
import { renderWithAppProviders } from "@/tests/support/render";
import { userEvent, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockEmailSignUp = jest.fn();
const mockOAuthSignIn = jest.fn();

jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router");

  return {
    ...actual,
    useRouter: () => ({ replace: mockReplace })
  };
});

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useEmailSignUp: jest.fn(),
  useOAuthSignIn: jest.fn()
}));

describe("SignUpScreen", () => {
  beforeEach(() => {
    jest.mocked(useEmailSignUp).mockReturnValue({
      mutateAsync: mockEmailSignUp
    } as never);
    jest.mocked(useOAuthSignIn).mockReturnValue({
      mutateAsync: mockOAuthSignIn
    } as never);
    mockEmailSignUp.mockResolvedValue({
      email: "builder@example.com",
      status: "verification-sent"
    });
    mockOAuthSignIn.mockResolvedValue(undefined);
  });

  it("reveals validation errors without submitting an incomplete form", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<SignUpScreen />);

    await user.press(
      view.getByRole("button", { name: "Create Account" })
    );

    expect(await view.findByText("Invalid email address")).toBeOnTheScreen();
    expect(mockEmailSignUp).not.toHaveBeenCalled();
  });

  it("creates an account and routes to email verification", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<SignUpScreen />);

    await user.type(
      view.getByPlaceholderText("name@company.com"),
      "builder@example.com"
    );
    await user.type(
      view.getByPlaceholderText("min 8 characters"),
      "Strong1!"
    );
    await user.press(view.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mockEmailSignUp).toHaveBeenCalledWith({
        email: "builder@example.com",
        password: "Strong1!"
      });
      expect(mockReplace).toHaveBeenCalledWith(
        "/verify-email?email=builder%40example.com&notice=sent"
      );
    });
  });

  it("preserves the rate-limited verification outcome", async () => {
    mockEmailSignUp.mockResolvedValue({
      email: "crew+site@example.com",
      status: "verification-rate-limited"
    });
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<SignUpScreen />);

    await user.type(
      view.getByPlaceholderText("name@company.com"),
      "crew+site@example.com"
    );
    await user.type(
      view.getByPlaceholderText("min 8 characters"),
      "Strong1!"
    );
    await user.press(view.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/verify-email?email=crew%2Bsite%40example.com&notice=rate-limited"
      );
    });
  });

  it("starts OAuth and shows a safe provider failure", async () => {
    mockOAuthSignIn.mockRejectedValue(new Error("provider details"));
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<SignUpScreen />);

    await user.press(view.getByLabelText("Continue with Apple"));

    expect(mockOAuthSignIn).toHaveBeenCalledWith("apple");
    expect(
      await view.findByText(
        "We couldn't start that sign-up method. Try again."
      )
    ).toBeOnTheScreen();
  });
});
