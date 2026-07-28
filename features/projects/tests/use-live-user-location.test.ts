import { useLiveUserLocation } from "@/features/projects/hooks/use-live-user-location";
import { renderHookWithAppProviders } from "@/tests/support/render";
import { act, waitFor } from "@testing-library/react-native";
import * as Location from "expo-location";

const mockRemove = jest.fn();
let mockPositionCallback:
  | ((position: Location.LocationObject) => void)
  | undefined;

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  PermissionStatus: { GRANTED: "granted" },
  requestForegroundPermissionsAsync: jest.fn(),
  watchPositionAsync: jest.fn(
    (_options: unknown, callback: (position: Location.LocationObject) => void) => {
      mockPositionCallback = callback;
      return Promise.resolve({ remove: mockRemove });
    }
  )
}));

describe("useLiveUserLocation", () => {
  it("reports denied permission without starting a watcher", async () => {
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
      canAskAgain: true,
      expires: "never",
      granted: false,
      status: "denied" as never
    });
    const hook = await renderHookWithAppProviders(
      () => useLiveUserLocation()
    );

    await act(async () => {
      await hook.result.current.start();
    });
    expect(hook.result.current.status).toBe("unavailable");
    expect(Location.watchPositionAsync).not.toHaveBeenCalled();
    await hook.unmount();
  });

  it("watches, publishes, and stops a granted location", async () => {
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
      canAskAgain: true,
      expires: "never",
      granted: true,
      status: "granted" as never
    });
    const hook = await renderHookWithAppProviders(
      () => useLiveUserLocation()
    );

    await act(async () => {
      await hook.result.current.start();
    });
    await act(async () => {
      mockPositionCallback?.({
        coords: {
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          latitude: -34.6,
          longitude: -58.4,
          speed: null
        },
        mocked: true,
        timestamp: 1
      });
    });
    await waitFor(() => expect(hook.result.current.isWatching).toBe(true));
    expect(hook.result.current.location).toEqual({
      accuracy: 5,
      latitude: -34.6,
      longitude: -58.4
    });

    await act(async () => {
      hook.result.current.stop();
    });
    expect(mockRemove).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(hook.result.current.status).toBe("idle"));
    await hook.unmount();
  });
});
