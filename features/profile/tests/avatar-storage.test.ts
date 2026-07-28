import {
  buildProfileAvatarPath,
  getProfileAvatarStoragePath
} from "@/features/profile/utils/avatar-storage";
import { describe, expect, it } from "vitest";

describe("profile avatar storage paths", () => {
  it("stores uploaded avatars under the current user folder", () => {
    expect(
      buildProfileAvatarPath({
        asset: { fileName: "headshot.jpeg", mimeType: "image/jpeg" },
        userId: "user-id",
        uuid: "avatar-id"
      })
    ).toBe("users/user-id/avatar/avatar-id.jpg");
  });

  it("falls back to mime type when the asset has no file name", () => {
    expect(
      buildProfileAvatarPath({
        asset: { mimeType: "image/png" },
        userId: "user-id",
        uuid: "avatar-id"
      })
    ).toBe("users/user-id/avatar/avatar-id.png");
  });

  it("accepts a stored path for the current user's avatar", () => {
    expect(
      getProfileAvatarStoragePath({
        bucket: "user-avatars",
        reference: "users/user-id/avatar/avatar-id.jpg",
        userId: "user-id"
      })
    ).toBe("users/user-id/avatar/avatar-id.jpg");
  });

  it("extracts paths from legacy public and signed URLs", () => {
    expect(
      getProfileAvatarStoragePath({
        bucket: "user-avatars",
        reference:
          "https://project.supabase.co/storage/v1/object/public/user-avatars/users/user-id/avatar/avatar-id.jpg",
        userId: "user-id"
      })
    ).toBe("users/user-id/avatar/avatar-id.jpg");
    expect(
      getProfileAvatarStoragePath({
        bucket: "user-avatars",
        reference:
          "https://project.supabase.co/storage/v1/object/sign/user-avatars/users/user-id/avatar/avatar-id.jpg?token=signed",
        userId: "user-id"
      })
    ).toBe("users/user-id/avatar/avatar-id.jpg");
  });

  it("rejects external and other-user avatar URLs", () => {
    expect(
      getProfileAvatarStoragePath({
        bucket: "user-avatars",
        reference: "https://images.example.com/avatar.jpg",
        userId: "user-id"
      })
    ).toBeNull();
    expect(
      getProfileAvatarStoragePath({
        bucket: "user-avatars",
        reference:
          "https://project.supabase.co/storage/v1/object/public/user-avatars/users/other-user/avatar/avatar-id.jpg",
        userId: "user-id"
      })
    ).toBeNull();
  });
});
