import {
  usePasswordRecoveryPreparation,
  usePasswordResetRequest,
  usePasswordUpdate
} from "@/features/auth/hooks/use-auth-mutations";
import ResetPasswordScreen from "@/features/auth/screens/reset-password-screen";
import { renderWithAppProviders } from "@/tests/support/render";
import { userEvent, waitFor } from "@testing-library/react-native";
import * as Linking from "expo-linking";

const mockReplace = jest.fn();
const mockPrepare = jest.fn();
const mockRequest = jest.fn();
const mockUpdate = jest.fn();

jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router");

  return {
    ...actual,
    useRouter: () => ({ replace: mockReplace })
  };
});

jest.mock("expo-linking", () => ({
  useURL: jest.fn()
}));

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  usePasswordRecoveryPreparation: jest.fn(),
  usePasswordResetRequest: jest.fn(),
  usePasswordUpdate: jest.fn()
}));

describe("ResetPasswordScreen", () => {
  beforeEach(() => {
    jest.mocked(Linking.useURL).mockReturnValue(null);
    jest.mocked(usePasswordRecoveryPreparation).mockReturnValue({
      mutateAsync: mockPrepare
    } as never);
    jest.mocked(usePasswordResetRequest).mockReturnValue({
      mutateAsync: mockRequest
    } as never);
    jest.mocked(usePasswordUpdate).mockReturnValue({
      mutateAsync: mockUpdate
    } as never);
    mockPrepare.mockResolvedValue({ shouldUpdatePassword: false });
    mockRequest.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
  });

  it("requests a reset link for a valid email", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<ResetPasswordScreen />);

    await waitFor(() => expect(mockPrepare).toHaveBeenCalledWith(null));
    await user.type(
      view.getByPlaceholderText("name@company.com"),
      "builder@example.com"
    );
    await user.press(view.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith("builder@example.com");
      expect(mockReplace).toHaveBeenCalledWith("/sign-in");
    });
  });

  it("opens password-update mode for a valid recovery link", async () => {
    jest.mocked(Linking.useURL).mockReturnValue("onzait://reset-password#token");
    mockPrepare.mockResolvedValue({ shouldUpdatePassword: true });
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<ResetPasswordScreen />);

    expect(
      await view.findByText("Update Your Password")
    ).toBeOnTheScreen();
    await user.type(
      view.getByPlaceholderText("new-password"),
      "Changed1!"
    );
    await user.type(
      view.getByPlaceholderText("confirm-password"),
      "Changed1!"
    );
    await user.press(view.getByRole("button", { name: "Update Password" }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith("Changed1!");
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("shows an actionable recovery-link error", async () => {
    mockPrepare.mockRejectedValue(new Error("invalid token"));
    const view = await renderWithAppProviders(<ResetPasswordScreen />);

    expect(
      await view.findByText(
        "We couldn't open this password recovery link. Request a new link and try again."
      )
    ).toBeOnTheScreen();
  });
});
