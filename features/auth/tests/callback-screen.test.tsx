import { useAuthCallbackCompletion } from "@/features/auth/hooks/use-auth-mutations";
import AuthCallbackScreen from "@/features/auth/screens/callback-screen";
import { renderWithAppProviders } from "@/tests/support/render";
import { userEvent, waitFor } from "@testing-library/react-native";
import * as Linking from "expo-linking";

const mockReplace = jest.fn();
const mockComplete = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace })
}));

jest.mock("expo-linking", () => ({
  useURL: jest.fn()
}));

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useAuthCallbackCompletion: jest.fn()
}));

describe("AuthCallbackScreen", () => {
  beforeEach(() => {
    jest.mocked(Linking.useURL).mockReturnValue("onzait://callback?code=abc");
    jest.mocked(useAuthCallbackCompletion).mockReturnValue({
      mutateAsync: mockComplete
    } as never);
    mockComplete.mockResolvedValue({
      intent: { kind: "sign-in" },
      redirectPath: "/"
    });
  });

  it("completes the callback and follows its safe redirect", async () => {
    await renderWithAppProviders(<AuthCallbackScreen />);

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(
        "onzait://callback?code=abc"
      );
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("recovers an identity-link failure back to profile", async () => {
    const error = Object.assign(new Error("provider details"), {
      intent: { kind: "identity-link", provider: "google" }
    });
    mockComplete.mockRejectedValue(error);
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<AuthCallbackScreen />);

    expect(
      await view.findByText(
        "We couldn't finish linking this sign-in method. Return to your profile and try again."
      )
    ).toBeOnTheScreen();
    expect(view.getByText("Linking Google")).toBeOnTheScreen();

    await user.press(view.getByRole("button", { name: "Back to Profile" }));
    expect(mockReplace).toHaveBeenCalledWith("/profile");
  });
});
