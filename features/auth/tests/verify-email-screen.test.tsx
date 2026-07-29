import { useEmailVerificationResend } from "@/features/auth/hooks/use-auth-mutations";
import VerifyEmailScreen from "@/features/auth/screens/verify-email-screen";
import { renderWithAppProviders } from "@/tests/support/render";
import { userEvent, waitFor } from "@testing-library/react-native";

const mockResend = jest.fn();

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useEmailVerificationResend: jest.fn()
}));

describe("VerifyEmailScreen", () => {
  beforeEach(() => {
    jest.mocked(useEmailVerificationResend).mockReturnValue({
      mutateAsync: mockResend
    } as never);
    mockResend.mockResolvedValue({ status: "sent" });
  });

  it("normalizes the email and resends verification", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(
      <VerifyEmailScreen email=" Builder@Example.com " />
    );

    expect(view.getByText("builder@example.com")).toBeOnTheScreen();
    await user.press(
      view.getByRole("button", { name: "Resend Verification Link" })
    );

    await waitFor(() => {
      expect(mockResend).toHaveBeenCalledWith({
        email: "builder@example.com",
        next: undefined
      });
    });
    expect(
      view.getByText(
        "Verification link sent. Check your inbox and spam folder."
      )
    ).toBeOnTheScreen();
    expect(view.getByText("Resend in 60s")).toBeOnTheScreen();
  });

  it("disables resend during the initial cooldown", async () => {
    const view = await renderWithAppProviders(
      <VerifyEmailScreen email="builder@example.com" notice="rate-limited" />
    );

    expect(view.getByRole("button", { name: "Resend in 60s" })).toBeDisabled();
  });

  it("does not offer resend without a valid email", async () => {
    const view = await renderWithAppProviders(<VerifyEmailScreen />);

    expect(view.getByText("No email address was provided.")).toBeOnTheScreen();
    expect(
      view.getByRole("button", { name: "Resend Verification Link" })
    ).toBeDisabled();
    expect(mockResend).not.toHaveBeenCalled();
  });
});
