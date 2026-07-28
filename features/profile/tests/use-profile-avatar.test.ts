import {
  useChangeProfilePassword,
  useLinkProfileIdentity,
  useProfileAvatarUrl,
  useProfileUserIdentities
} from "@/features/profile/hooks/use-profile-avatar";
import {
  changeProfilePassword,
  linkProfileIdentity,
  listProfileUserIdentities,
  resolveProfileAvatarUrl
} from "@/features/profile/services/profile.service";
import {
  createTestQueryClient,
  renderHookWithAppProviders
} from "@/tests/support/render";
import { act, waitFor } from "@testing-library/react-native";

jest.mock("@/features/profile/services/profile.service", () => ({
  changeProfilePassword: jest.fn(),
  linkProfileIdentity: jest.fn(),
  listProfileUserIdentities: jest.fn(),
  resolveProfileAvatarUrl: jest.fn()
}));

describe("useProfileAvatarUrl", () => {
  it("does not resolve an empty avatar reference", async () => {
    const queryClient = createTestQueryClient();
    const { result, unmount } = await renderHookWithAppProviders(
      () => useProfileAvatarUrl("  "),
      { queryClient }
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(resolveProfileAvatarUrl).not.toHaveBeenCalled();
    await unmount();
    queryClient.clear();
  });

  it("resolves the normalized avatar reference", async () => {
    jest
      .mocked(resolveProfileAvatarUrl)
      .mockResolvedValue("https://signed.example/avatar");
    const queryClient = createTestQueryClient();
    const { result, unmount } = await renderHookWithAppProviders(
      () => useProfileAvatarUrl("  owner-1/avatar.jpg  "),
      { queryClient }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(resolveProfileAvatarUrl).toHaveBeenCalledWith(
      "owner-1/avatar.jpg"
    );
    expect(result.current.data).toBe("https://signed.example/avatar");
    await unmount();
    queryClient.clear();
  });
});

describe("profile identity and password mutations", () => {
  it("loads identities only when authentication is available", async () => {
    jest.mocked(listProfileUserIdentities).mockResolvedValue([]);
    const queryClient = createTestQueryClient();
    const disabled = await renderHookWithAppProviders(
      () => useProfileUserIdentities(false),
      { queryClient }
    );

    expect(disabled.result.current.fetchStatus).toBe("idle");
    expect(listProfileUserIdentities).not.toHaveBeenCalled();
    await disabled.unmount();

    const enabled = await renderHookWithAppProviders(
      () => useProfileUserIdentities(true),
      { queryClient }
    );
    await waitFor(() => {
      expect(enabled.result.current.isSuccess).toBe(true);
    });
    expect(listProfileUserIdentities).toHaveBeenCalledTimes(1);
    await enabled.unmount();
    queryClient.clear();
  });

  it("passes supported providers to the identity service", async () => {
    jest.mocked(linkProfileIdentity).mockResolvedValue({
      session: null,
      type: null
    });
    const queryClient = createTestQueryClient();
    const { result, unmount } = await renderHookWithAppProviders(
      () => useLinkProfileIdentity(),
      { queryClient }
    );

    await act(async () => {
      await result.current.mutateAsync("google");
    });

    expect(linkProfileIdentity).toHaveBeenCalledWith("google");
    await unmount();
    queryClient.clear();
  });

  it("passes password changes to the profile service", async () => {
    jest.mocked(changeProfilePassword).mockResolvedValue({
      user: {} as never
    });
    const queryClient = createTestQueryClient();
    const { result, unmount } = await renderHookWithAppProviders(
      () => useChangeProfilePassword(),
      { queryClient }
    );

    await act(async () => {
      await result.current.mutateAsync("Secure123!");
    });

    expect(changeProfilePassword).toHaveBeenCalledWith("Secure123!");
    await unmount();
    queryClient.clear();
  });
});
