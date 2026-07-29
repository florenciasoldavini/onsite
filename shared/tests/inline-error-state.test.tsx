import { InlineErrorState } from "@/shared/ui/components/inline-error-state";
import { renderWithAppProviders } from "@/tests/support/render";
import { screen, userEvent } from "@testing-library/react-native";

describe("InlineErrorState", () => {
  it("renders a retryable alert without representing an empty collection", async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();

    await renderWithAppProviders(
      <InlineErrorState
        action={{ label: "Retry", onPress: onRetry }}
        description="We couldn't load this section."
        title="Section unavailable"
      />
    );

    expect(screen.getByText("Section unavailable")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
