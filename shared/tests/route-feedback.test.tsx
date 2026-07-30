import {
  RouteFeedback,
  RouteStateBoundary
} from "@/shared/ui/components/route-feedback";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen } from "@testing-library/react-native";
import { Text } from "react-native";

describe("RouteFeedback", () => {
  it("renders consistent invalid-route feedback and navigation", async () => {
    const onBack = jest.fn();

    await renderWithAppProviders(
      <RouteFeedback
        action={{ label: "Back", onPress: onBack }}
        kind="invalid-params"
        resourceName="project"
      />
    );

    expect(screen.getByText("Invalid project link")).toBeOnTheScreen();
    expect(
      screen.getByText("This project link is incomplete or invalid.")
    ).toBeOnTheScreen();
    expect(screen.getByTestId("route-feedback")).toHaveStyle({
      alignSelf: "center",
      maxWidth: 560,
      width: "100%"
    });

    await fireEvent.press(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders the highest-priority active route state", async () => {
    await renderWithAppProviders(
      <RouteStateBoundary
        isError
        isForbidden
        isInvalid
        isLoading
        isNotFound
        loadingFallback={<Text>Loading route</Text>}
        resourceName="client"
      >
        <Text>Protected form</Text>
      </RouteStateBoundary>
    );

    expect(screen.queryByText("Protected form")).not.toBeOnTheScreen();
    expect(screen.queryByText("Loading route")).not.toBeOnTheScreen();
    expect(screen.getByText("Invalid client link")).toBeOnTheScreen();
  });

  it("renders the loading fallback while route data is pending", async () => {
    await renderWithAppProviders(
      <RouteStateBoundary
        isLoading
        loadingFallback={<Text>Loading route</Text>}
        resourceName="client"
      >
        <Text>Protected form</Text>
      </RouteStateBoundary>
    );

    expect(screen.getByText("Loading route")).toBeOnTheScreen();
    expect(screen.queryByText("Protected form")).not.toBeOnTheScreen();
  });

  it("renders protected content when no route state is active", async () => {
    await renderWithAppProviders(
      <RouteStateBoundary
        loadingFallback={<Text>Loading route</Text>}
        resourceName="client"
      >
        <Text>Protected form</Text>
      </RouteStateBoundary>
    );

    expect(screen.getByText("Protected form")).toBeOnTheScreen();
  });

  it("supports state-specific feedback overrides", async () => {
    const onRetry = jest.fn();

    await renderWithAppProviders(
      <RouteStateBoundary
        feedback={{
          loadError: {
            action: { label: "Retry", onPress: onRetry },
            description: "Custom loading failure."
          }
        }}
        isError
        loadingFallback={<Text>Loading route</Text>}
        resourceName="client"
      >
        <Text>Protected form</Text>
      </RouteStateBoundary>
    );

    expect(screen.getByText("Custom loading failure.")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
