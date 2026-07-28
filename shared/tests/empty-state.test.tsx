import { EmptyState } from "@/shared/ui/components/empty-state";
import { renderWithAppProviders } from "@/tests/support/render";
import { screen, userEvent } from "@testing-library/react-native";

describe("EmptyState", () => {
  it("renders its message and invokes the optional action", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    await renderWithAppProviders(
      <EmptyState
        action={{ label: "Create project", onPress }}
        description="Start by creating the first project."
        title="No projects yet"
      />
    );

    expect(screen.getByText("No projects yet")).toBeOnTheScreen();
    expect(
      screen.getByText("Start by creating the first project.")
    ).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "Create project" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
