import { ProfileSecurityTab } from "@/features/profile/components/profile-security-tab";
import { useChangeProfilePassword } from "@/features/profile/hooks/use-profile-avatar";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

const mockChangePassword = jest.fn();

jest.mock("@/features/profile/hooks/use-profile-avatar", () => ({
  useChangeProfilePassword: jest.fn()
}));

jest.mock("@/infrastructure/supabase/client", () => ({
  getSupabaseErrorMessage: () => "We couldn't change your password."
}));

describe("ProfileSecurityTab", () => {
  beforeEach(() => {
    jest.mocked(useChangeProfilePassword).mockReturnValue({
      isPending: false,
      mutateAsync: mockChangePassword
    } as never);
    mockChangePassword.mockResolvedValue(undefined);
  });

  it("keeps submission disabled until matching secure passwords are valid", async () => {
    await renderWithAppProviders(<ProfileSecurityTab />);

    expect(screen.getByText("Change Password")).toBeDisabled();
    await fireEvent.changeText(
      screen.getByPlaceholderText("new-password"),
      "Changed1!"
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("confirm-password"),
      "Changed1!"
    );
    await waitFor(() => {
      expect(screen.getByText("Change Password")).toBeEnabled();
    });
    await fireEvent.press(screen.getByText("Change Password"));

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith("Changed1!");
    });
    expect(await screen.findByText("Password updated.")).toBeOnTheScreen();
  });
});
