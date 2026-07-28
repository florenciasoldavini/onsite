import {
  useLocationAddressField,
  useLocationMapPreview
} from "@/features/locations/hooks/use-location-address";
import {
  autocompleteAddresses,
  getLocationMapPreview,
  resolveAddress
} from "@/features/locations/services/locations.service";
import {
  createTestQueryClient,
  renderHookWithAppProviders
} from "@/tests/support/render";
import { act, waitFor } from "@testing-library/react-native";

jest.mock("@/features/locations/services/locations.service", () => ({
  autocompleteAddresses: jest.fn(),
  getLocationMapPreview: jest.fn(),
  resolveAddress: jest.fn()
}));

describe("useLocationAddressField", () => {
  beforeEach(() => {
    jest.mocked(autocompleteAddresses).mockResolvedValue([]);
    jest.mocked(getLocationMapPreview).mockResolvedValue({
      attribution: "Google",
      imageDataUrl: "data:image/png;base64,map"
    });
  });

  it("clears stale resolved values when the user edits the address", async () => {
    const onChange = jest.fn();
    const queryClient = createTestQueryClient();
    const hook = await renderHookWithAppProviders(
      () =>
        useLocationAddressField({
          onChange,
          value: {
            address: "1 Site Road",
            latitude: -34.6,
            longitude: -58.4,
            placeId: "place-1"
          }
        }),
      { queryClient }
    );

    await act(async () => {
      hook.result.current.onChangeText("2 Site Road");
    });
    expect(onChange).toHaveBeenCalledWith(null);
    await hook.unmount();
    queryClient.clear();
  });

  it("resolves a selected suggestion into an atomic address value", async () => {
    const resolved = {
      address: "2 Site Road",
      latitude: -34.61,
      longitude: -58.41,
      placeId: "place-2"
    };
    jest.mocked(resolveAddress).mockResolvedValue(resolved);
    const onChange = jest.fn();
    const queryClient = createTestQueryClient();
    const hook = await renderHookWithAppProviders(
      () => useLocationAddressField({ onChange, value: null }),
      { queryClient }
    );

    await act(async () => {
      await hook.result.current.onSuggestionPress("place-2");
    });
    expect(resolveAddress).toHaveBeenCalledWith({
      placeId: "place-2",
      sessionToken: expect.any(String)
    });
    expect(onChange).toHaveBeenCalledWith(resolved);
    expect(hook.result.current.query).toBe("2 Site Road");
    await hook.unmount();
    queryClient.clear();
  });

  it("loads suggestions only after focus and sufficient input", async () => {
    jest.mocked(autocompleteAddresses).mockResolvedValue([
      { placeId: "place-1", text: "Site Road" }
    ]);
    const queryClient = createTestQueryClient();
    const hook = await renderHookWithAppProviders(
      () => useLocationAddressField({ onChange: jest.fn(), value: null }),
      { queryClient }
    );

    await act(async () => {
      hook.result.current.onFocus();
      hook.result.current.onChangeText("Site");
    });
    await waitFor(
      () => expect(hook.result.current.suggestions).toHaveLength(1),
      { timeout: 1500 }
    );
    expect(autocompleteAddresses).toHaveBeenCalledWith({
      input: "Site",
      sessionToken: expect.any(String)
    });
    await hook.unmount();
    queryClient.clear();
  });
});

describe("useLocationMapPreview", () => {
  it("does not request a preview until both coordinates exist", async () => {
    const queryClient = createTestQueryClient();
    const hook = await renderHookWithAppProviders(
      () => useLocationMapPreview({ latitude: -34.6, longitude: null }),
      { queryClient }
    );

    expect(hook.result.current.fetchStatus).toBe("idle");
    expect(getLocationMapPreview).not.toHaveBeenCalled();
    await hook.unmount();
    queryClient.clear();
  });
});
