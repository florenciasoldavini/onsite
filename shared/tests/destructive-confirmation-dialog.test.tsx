import {
  DestructiveConfirmationDialog,
  type DestructiveConfirmationController
} from "@/shared/ui/components/destructive-confirmation-dialog";
import { renderWithAppProviders } from "@/tests/support/render";
import { screen, userEvent } from "@testing-library/react-native";

function createController(
  overrides: Partial<DestructiveConfirmationController> = {}
): DestructiveConfirmationController {
  return {
    clearError: jest.fn(),
    close: jest.fn(),
    error: null,
    isOpen: true,
    open: jest.fn(),
    setError: jest.fn(),
    ...overrides
  };
}

describe("DestructiveConfirmationDialog", () => {
  it("renders the consequence, error, and distinct actions", async () => {
    const controller = createController({
      error: "The project could not be deleted."
    });
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    await renderWithAppProviders(
      <DestructiveConfirmationDialog
        accessibilityLabel="Dismiss delete project dialog"
        controller={controller}
        description="This permanently removes the project."
        isPending={false}
        onConfirm={onConfirm}
        title="Delete project?"
      />
    );

    expect(screen.getByText("Delete project?")).toBeOnTheScreen();
    expect(
      screen.getByText("This permanently removes the project.")
    ).toBeOnTheScreen();
    expect(
      screen.getByText("The project could not be deleted.")
    ).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "Cancel" }));
    await user.press(screen.getByRole("button", { name: "Delete" }));

    expect(controller.close).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("prevents repeat confirmation and dismissal while pending", async () => {
    const controller = createController();
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    await renderWithAppProviders(
      <DestructiveConfirmationDialog
        accessibilityLabel="Dismiss delete project dialog"
        controller={controller}
        description="This permanently removes the project."
        isPending
        onConfirm={onConfirm}
        title="Delete project?"
      />
    );

    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: /Delete/ });

    expect(cancel).toBeDisabled();
    expect(confirm).toBeDisabled();

    await user.press(cancel);
    await user.press(confirm);
    await user.press(
      screen.getByRole("button", {
        name: "Dismiss delete project dialog"
      })
    );

    expect(controller.close).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
