import {
  canDismissDestructiveConfirmation,
  destructiveConfirmationReducer,
  initialDestructiveConfirmationState
} from "@/shared/ui/components/destructive-confirmation-state";

describe("destructive confirmation state", () => {
  it("clears stale errors whenever the dialog opens", () => {
    const stateWithError = {
      error: "Delete failed",
      isOpen: false
    };

    expect(
      destructiveConfirmationReducer(stateWithError, { type: "open" })
    ).toEqual({
      error: null,
      isOpen: true
    });
  });

  it("keeps mutation errors visible until they are cleared or reopened", () => {
    const openState = destructiveConfirmationReducer(
      initialDestructiveConfirmationState,
      { type: "open" }
    );

    expect(
      destructiveConfirmationReducer(openState, {
        error: "Try again",
        type: "set-error"
      })
    ).toEqual({
      error: "Try again",
      isOpen: true
    });
  });

  it("prevents dismissing while a destructive mutation is pending", () => {
    expect(canDismissDestructiveConfirmation(true)).toBe(false);
    expect(canDismissDestructiveConfirmation(false)).toBe(true);
  });
});
