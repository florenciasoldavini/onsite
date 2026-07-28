import {
  getPersonDisplayName,
  getPersonInitials,
  normalizeEmailInput,
  normalizeNullableText,
  toPersonContactInput
} from "@/shared/utils/contact";

describe("contact utilities", () => {
  it("normalizes optional text, email, and form input", () => {
    expect(normalizeNullableText("  ")).toBeNull();
    expect(normalizeNullableText("  value ")).toBe("value");
    expect(normalizeEmailInput(" PERSON@EXAMPLE.COM ")).toBe(
      "person@example.com"
    );
    expect(
      toPersonContactInput({
        email: " PERSON@EXAMPLE.COM ",
        first_name: " Alex ",
        last_name: " Morgan ",
        phone_number: " +54 11 5555 0101 "
      })
    ).toEqual({
      email: "person@example.com",
      first_name: "Alex",
      last_name: "Morgan",
      phone_number: "+54 11 5555 0101"
    });
  });

  it("builds display names and initials", () => {
    expect(
      getPersonDisplayName({ first_name: "Alex", last_name: "Morgan" })
    ).toBe("Alex Morgan");
    expect(getPersonDisplayName({ first_name: "Alex", last_name: null })).toBe(
      "Alex"
    );
    expect(getPersonInitials({ first_name: "Alex", last_name: "Morgan" })).toBe(
      "AM"
    );
    expect(getPersonInitials({ first_name: "Alex", last_name: null })).toBe(
      "AL"
    );
  });
});
