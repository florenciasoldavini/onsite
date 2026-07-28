import { USER_ROLES } from "@/features/auth/constants/user.constants";
import { UserSchema } from "@/features/auth/schemas/user.schema";
import { describe, expect, it } from "vitest";

const validUser = {
  avatar: null,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  deleted_at: null,
  email: "user@example.com",
  first_name: "Test",
  id: "user-1",
  last_name: null,
  phone_number: null,
  role: "user",
  updated_at: null,
  welcome_email_sent_at: null
};

describe("user role schema", () => {
  it.each(USER_ROLES)("accepts the canonical %s role", (role) => {
    expect(UserSchema.parse({ ...validUser, role }).role).toBe(role);
  });

  it("rejects roles outside the canonical list", () => {
    expect(
      UserSchema.safeParse({ ...validUser, role: "manager" }).success
    ).toBe(false);
  });
});
