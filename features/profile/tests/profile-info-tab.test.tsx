import type { User } from "@/features/auth/types/auth.types";
import { ProfileInfoTab } from "@/features/profile/components/profile-info-tab";
import { useProfileAvatarUrl } from "@/features/profile/hooks/use-profile-avatar";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import type { Session } from "@supabase/supabase-js";

const mockUpdateProfile = jest.fn();

jest.mock("expo-image-picker", () => ({
  MediaTypeOptions: { Images: "Images" },
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn()
}));

jest.mock("@/features/profile/hooks/use-profile-avatar", () => ({
  useProfileAvatarUrl: jest.fn()
}));

jest.mock("@/infrastructure/supabase/client", () => ({
  getSupabaseErrorMessage: () => "We couldn't update your profile."
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
  welcome_email_sent_at: null
};
const session = { user: { email: user.email, id: user.id } } as Session;

describe("ProfileInfoTab", () => {
  beforeEach(() => {
    jest.mocked(useProfileAvatarUrl).mockReturnValue({
      data: null,
      error: null,
      isLoading: false
    } as never);
    mockUpdateProfile.mockResolvedValue({
      ...user,
      first_name: "Florencia"
    });
  });

  it("saves edited profile information", async () => {
    await renderWithAppProviders(<ProfileInfoTab />, {
      auth: { session, updateUserProfile: mockUpdateProfile, user }
    });

    await fireEvent.changeText(
      screen.getByPlaceholderText("First name"),
      "Florencia"
    );
    await fireEvent.press(screen.getByText("Save Profile"));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        {
          avatar: "",
          first_name: "Florencia",
          last_name: "Manager",
          phone_number: ""
        },
        null
      );
    });
    expect(await screen.findByText("Profile updated")).toBeOnTheScreen();
  });

  it("explains permanently denied photo access", async () => {
    jest.mocked(
      ImagePicker.requestMediaLibraryPermissionsAsync
    ).mockResolvedValue({
      canAskAgain: false,
      expires: "never",
      granted: false,
      status: "denied" as never
    });
    await renderWithAppProviders(<ProfileInfoTab />, {
      auth: { session, updateUserProfile: mockUpdateProfile, user }
    });

    await fireEvent.press(screen.getByLabelText("Change profile photo"));

    expect(
      await screen.findByText(
        "Photo access is disabled. Enable it in your device settings, then try again."
      )
    ).toBeOnTheScreen();
  });
});
