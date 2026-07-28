import {
  clientsKey,
  useClients,
  useCreateClient,
  useSoftDeleteClient
} from "@/features/clients/hooks/use-clients";
import {
  createClient,
  listClients,
  softDeleteClient
} from "@/features/clients/services/clients.service";
import type { Client } from "@/features/clients/types/client";
import type { User } from "@/features/auth/types/auth.types";
import {
  createTestQueryClient,
  renderHookWithAppProviders
} from "@/tests/support/render";
import { act, waitFor } from "@testing-library/react-native";
import type { Session } from "@supabase/supabase-js";

jest.mock("@/features/clients/services/clients.service", () => ({
  countClientProjects: jest.fn(),
  createClient: jest.fn(),
  getClient: jest.fn(),
  listClients: jest.fn(),
  softDeleteClient: jest.fn(),
  updateClient: jest.fn()
}));

const user: User = {
  avatar: null,
  created_at: new Date("2026-07-28T10:00:00.000Z"),
  deleted_at: null,
  email: "owner@example.com",
  first_name: "Site",
  id: "owner-1",
  last_name: "Manager",
  phone_number: null,
  role: "user",
  updated_at: null,
  welcome_email_sent_at: new Date("2026-07-28T10:01:00.000Z")
};

const session = {
  user: {
    email: user.email,
    id: user.id
  }
} as Session;

const client: Client = {
  created_at: "2026-07-28T10:00:00.000Z",
  deleted_at: null,
  email: null,
  first_name: "Ada",
  id: "client-1",
  last_name: null,
  owner_id: user.id,
  phone_number: null,
  updated_at: null
};

const clientInput = {
  email: null,
  first_name: "Ada",
  last_name: null,
  phone_number: null
};

describe("useClients", () => {
  it("does not load the catalog before authentication", async () => {
    const queryClient = createTestQueryClient();
    const { result, unmount } = await renderHookWithAppProviders(
      () => useClients(),
      { queryClient }
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(listClients).not.toHaveBeenCalled();
    await unmount();
    queryClient.clear();
  });

  it("loads the first bounded page for the authenticated owner", async () => {
    jest.mocked(listClients).mockResolvedValue({
      items: [client],
      nextOffset: null
    });

    const queryClient = createTestQueryClient();
    const { result, unmount } = await renderHookWithAppProviders(
      () => useClients(),
      {
        auth: { user },
        queryClient
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(listClients).toHaveBeenCalledWith({
      filters: { query: "" },
      offset: 0,
      pageSize: 24,
      userId: user.id,
      userRole: "user"
    });
    expect(result.current.data?.pages[0].items).toEqual([client]);
    await unmount();
    queryClient.clear();
  });
});

describe("useCreateClient", () => {
  it("rejects creation when there is no authenticated session", async () => {
    const queryClient = createTestQueryClient();
    const { result, unmount } = await renderHookWithAppProviders(
      () => useCreateClient(),
      { queryClient }
    );

    await act(async () => {
      await expect(
        result.current.mutateAsync(clientInput)
      ).rejects.toThrow("You must be signed in to save clients.");
    });
    expect(createClient).not.toHaveBeenCalled();
    await unmount();
    queryClient.clear();
  });

  it("hydrates a missing profile and primes the detail cache after creation", async () => {
    jest.mocked(createClient).mockResolvedValue(client);
    const createUser = jest.fn().mockResolvedValue(user);
    const queryClient = createTestQueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    const { result, unmount } = await renderHookWithAppProviders(
      () => useCreateClient(),
      {
        auth: { createUser, session, user: null },
        queryClient
      }
    );

    await act(async () => {
      await result.current.mutateAsync(clientInput);
    });

    expect(createUser).toHaveBeenCalledWith(session);
    expect(createClient).toHaveBeenCalledWith(clientInput);
    expect(
      queryClient.getQueryData([...clientsKey, "detail", client.id])
    ).toEqual(client);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: clientsKey
    });
    await unmount();
    queryClient.clear();
  });
});

describe("useSoftDeleteClient", () => {
  it("invalidates both clients and projects after deletion", async () => {
    jest.mocked(softDeleteClient).mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    const { result, unmount } = await renderHookWithAppProviders(
      () => useSoftDeleteClient(),
      { queryClient }
    );

    await act(async () => {
      await result.current.mutateAsync(client.id);
    });

    expect(softDeleteClient).toHaveBeenCalledWith(client.id);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: clientsKey
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["projects"]
    });
    await unmount();
    queryClient.clear();
  });
});
