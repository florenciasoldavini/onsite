import { useAuth } from "@/features/auth/hooks/use-auth";
import { normalizeClientFilters } from "@/features/clients/schemas/client.schema";
import {
  countClientProjects,
  createClient,
  getClient,
  listClients,
  softDeleteClient,
  updateClient
} from "@/features/clients/services/clients.service";
import type {
  ClientFilters,
  ClientSummary,
  CreateClientInput,
  UpdateClientInput
} from "@/features/clients/types/client";
import {
  DEFAULT_PAGE_SIZE,
  type PaginatedResult
} from "@/shared/utils/pagination";
import { UserFacingError } from "@/shared/utils/user-facing-errors";
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export const clientsKey = ["clients"] as const;

export function useClients(filters: ClientFilters = {}) {
  const { user } = useAuth();
  const debouncedQuery = useDebouncedValue(filters.query ?? "", 350);
  const requestFilters = useMemo(
    () => ({ ...filters, query: debouncedQuery }),
    [debouncedQuery, filters]
  );
  const normalizedFilters = useMemo(
    () => normalizeClientFilters(requestFilters),
    [requestFilters]
  );

  return useInfiniteQuery<
    PaginatedResult<ClientSummary>,
    Error,
    InfiniteData<PaginatedResult<ClientSummary>>,
    readonly unknown[],
    number
  >({
    enabled: Boolean(user),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listClients({
        filters: requestFilters,
        offset: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
        userId: user!.id,
        userRole: user!.role
      }),
    queryKey: [...clientsKey, user?.id, user?.role, normalizedFilters]
  });
}

export function useClient(clientId?: string) {
  return useQuery({
    enabled: Boolean(clientId),
    queryFn: () => getClient(clientId!),
    queryKey: [...clientsKey, "detail", clientId]
  });
}

export function useClientProjectCount(clientId?: string) {
  return useQuery({
    enabled: Boolean(clientId),
    queryFn: () => countClientProjects(clientId!),
    queryKey: [...clientsKey, "project-count", clientId]
  });
}

export function useCreateClient() {
  const { createUser, session, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateClientInput) => {
      if (!session) {
        throw new UserFacingError("You must be signed in to save clients.");
      }

      const currentUser = user ?? (await createUser(session));

      if (!currentUser) {
        throw new UserFacingError(
          "We could not finish setting up your account. Sign out and back in, then try again."
        );
      }

      return createClient(input);
    },
    onSuccess: async (client) => {
      queryClient.setQueryData([...clientsKey, "detail", client.id], client);
      await queryClient.invalidateQueries({ queryKey: clientsKey });
    }
  });
}

export function useUpdateClient(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateClientInput) => updateClient(clientId, input),
    onSuccess: async (client) => {
      queryClient.setQueryData([...clientsKey, "detail", client.id], client);
      await queryClient.invalidateQueries({ queryKey: clientsKey });
    }
  });
}

export function useSoftDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => softDeleteClient(clientId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientsKey }),
        queryClient.invalidateQueries({ queryKey: ["projects"] })
      ]);
    }
  });
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
}
