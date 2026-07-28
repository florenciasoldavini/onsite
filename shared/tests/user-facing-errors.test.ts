import {
  UserFacingError,
  getUserFacingErrorMessage,
  toUserFacingError
} from "@/shared/utils/user-facing-errors";

describe("user-facing errors", () => {
  it("maps stable provider codes without exposing technical messages", () => {
    expect(
      getUserFacingErrorMessage(
        { code: "42501", message: "permission denied for table projects" },
        "Fallback"
      )
    ).toBe("You do not have permission to complete this action.");
    expect(
      getUserFacingErrorMessage(
        { code: "invalid_credentials", message: "Invalid login credentials" },
        "Fallback"
      )
    ).toBe(
      "The email or password is incorrect. Check your details and try again."
    );
  });

  it("uses the product fallback for unknown provider wording", () => {
    const message = getUserFacingErrorMessage(
      { message: "violates users_internal_state_check" },
      "We couldn't save your changes."
    );

    expect(message).toBe("We couldn't save your changes.");
  });

  it("preserves approved product copy and the technical cause", () => {
    const cause = new Error("private provider detail");
    const error = new UserFacingError("Try that action again.", cause);

    expect(getUserFacingErrorMessage(error, "Fallback")).toBe(
      "Try that action again."
    );
    expect(toUserFacingError(error, "Fallback")).toBe(error);
    expect(error.cause).toBe(cause);
  });

  it("recognizes Storage statusCode values", () => {
    expect(
      getUserFacingErrorMessage(
        { message: "Payload too large", statusCode: "413" },
        "Upload failed."
      )
    ).toBe(
      "This file is too large to upload. Choose a smaller file and try again."
    );
  });

  it("uses a stable connection message for transport errors", () => {
    expect(
      getUserFacingErrorMessage(
        new TypeError("Failed to fetch private endpoint details"),
        "Request failed."
      )
    ).toBe("Check your internet connection and try again.");
  });
});
