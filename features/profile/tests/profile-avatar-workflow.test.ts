import {
  resolveProfileAvatarUrl,
  saveProfile
} from "@/features/profile/services/profile.service";

const mocks = {
  captureException: jest.fn(),
  createProfileAvatarSignedUrl: jest.fn(),
  removeProfileAvatarObject: jest.fn(),
  updateProfileRow: jest.fn(),
  uploadProfileAvatarObject: jest.fn()
};

jest.mock("@/features/profile/repositories/profile-avatar.repository", () => ({
  get createProfileAvatarSignedUrl() {
    return mocks.createProfileAvatarSignedUrl;
  },
  get removeProfileAvatarObject() {
    return mocks.removeProfileAvatarObject;
  },
  get uploadProfileAvatarObject() {
    return mocks.uploadProfileAvatarObject;
  }
}));

jest.mock("@/features/profile/repositories/profile.repository", () => ({
  get updateProfileRow() {
    return mocks.updateProfileRow;
  }
}));

jest.mock("@/features/profile/repositories/profile-auth.repository", () => ({
  getProfileUserIdentities: jest.fn(),
  linkProfileOAuthIdentity: jest.fn(),
  updateProfilePassword: jest.fn()
}));

jest.mock("@/infrastructure/monitoring/sentry", () => ({
  Sentry: {
    get captureException() {
      return mocks.captureException;
    }
  }
}));

const profile = {
  avatar: null,
  first_name: "Florencia",
  last_name: null,
  phone_number: null
};
const avatarAsset = { uri: "file:///avatar.jpg" };

describe("profile avatar replacement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.uploadProfileAvatarObject.mockResolvedValue(
      "users/user-id/avatar/new.jpg"
    );
    mocks.updateProfileRow.mockResolvedValue({ id: "user-id" });
    mocks.createProfileAvatarSignedUrl.mockResolvedValue(
      "https://project.supabase.co/storage/v1/object/sign/user-avatars/users/user-id/avatar/new.jpg?token=signed"
    );
  });

  it("removes the new avatar when the profile update fails", async () => {
    mocks.updateProfileRow.mockRejectedValue(new Error("profile failed"));

    await expect(
      saveProfile({ avatarAsset, profile, userId: "user-id" })
    ).rejects.toThrow("profile failed");
    expect(mocks.removeProfileAvatarObject).toHaveBeenCalledWith({
      path: "users/user-id/avatar/new.jpg",
      userId: "user-id"
    });
  });

  it("removes the previous avatar after the new reference is saved", async () => {
    await saveProfile({
      avatarAsset,
      currentAvatarReference: "users/user-id/avatar/old.jpg",
      profile,
      userId: "user-id"
    });

    expect(mocks.updateProfileRow).toHaveBeenCalledWith({
      expectedAvatar: "users/user-id/avatar/old.jpg",
      profile: {
        ...profile,
        avatar: "users/user-id/avatar/new.jpg"
      },
      userId: "user-id"
    });
    expect(mocks.removeProfileAvatarObject).toHaveBeenCalledWith({
      path: "users/user-id/avatar/old.jpg",
      userId: "user-id"
    });
  });

  it("keeps the successful profile update when old-object cleanup fails", async () => {
    mocks.removeProfileAvatarObject.mockRejectedValue(
      new Error("cleanup failed")
    );

    await expect(
      saveProfile({
        avatarAsset,
        currentAvatarReference: "users/user-id/avatar/old.jpg",
        profile,
        userId: "user-id"
      })
    ).resolves.toEqual({ id: "user-id" });
    expect(mocks.captureException).toHaveBeenCalledTimes(1);
  });

  it("resolves stored avatar paths to short-lived signed URLs", async () => {
    await expect(
      resolveProfileAvatarUrl("users/user-id/avatar/new.jpg")
    ).resolves.toContain("token=signed");
    expect(mocks.createProfileAvatarSignedUrl).toHaveBeenCalledWith(
      "users/user-id/avatar/new.jpg"
    );
  });

  it("keeps external OAuth avatar URLs without signing them", async () => {
    await expect(
      resolveProfileAvatarUrl("https://accounts.example.com/avatar.jpg")
    ).resolves.toBe("https://accounts.example.com/avatar.jpg");
    expect(mocks.createProfileAvatarSignedUrl).not.toHaveBeenCalled();
  });
});
