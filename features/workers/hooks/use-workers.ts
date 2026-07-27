import { useAuth } from "@/features/auth/hooks/use-auth";
import { normalizeWorkerFilters } from "@/features/workers/schemas/worker.schema";
import {
  createWorker,
  getWorker,
  listWorkers,
  softDeleteWorker,
  updateWorker
} from "@/features/workers/services/workers.service";
import type {
  CreateWorkerInput,
  UpdateWorkerInput,
  WorkerFilters,
  WorkerSummary
} from "@/features/workers/types/worker";
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

export const workersKey = ["workers"] as const;

export function useWorkers(filters: WorkerFilters = {}) {
  const { user } = useAuth();
  const debouncedQuery = useDebouncedValue(filters.query ?? "", 350);
  const requestFilters = useMemo(
    () => ({ ...filters, query: debouncedQuery }),
    [debouncedQuery, filters]
  );
  const normalizedFilters = useMemo(
    () => normalizeWorkerFilters(requestFilters),
    [requestFilters]
  );

  return useInfiniteQuery<
    PaginatedResult<WorkerSummary>,
    Error,
    InfiniteData<PaginatedResult<WorkerSummary>>,
    readonly unknown[],
    number
  >({
    enabled: Boolean(user),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listWorkers({
        filters: requestFilters,
        offset: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
        userId: user!.id,
        userRole: user!.role
      }),
    queryKey: [...workersKey, user?.id, user?.role, normalizedFilters]
  });
}

export function useWorker(workerId?: string) {
  return useQuery({
    enabled: Boolean(workerId),
    queryFn: () => getWorker(workerId!),
    queryKey: [...workersKey, "detail", workerId]
  });
}

export function useCreateWorker() {
  const { createUser, session, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWorkerInput) => {
      if (!session) {
        throw new UserFacingError("You must be signed in to save workers.");
      }

      const currentUser = user ?? (await createUser(session));
      if (!currentUser) {
        throw new UserFacingError(
          "We could not finish setting up your account. Sign out and back in, then try again."
        );
      }

      return createWorker(input);
    },
    onSuccess: async (worker) => {
      queryClient.setQueryData([...workersKey, "detail", worker.id], worker);
      await queryClient.invalidateQueries({ queryKey: workersKey });
    }
  });
}

export function useUpdateWorker(workerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWorkerInput) => updateWorker(workerId, input),
    onSuccess: async (worker) => {
      queryClient.setQueryData([...workersKey, "detail", worker.id], worker);
      await queryClient.invalidateQueries({ queryKey: workersKey });
    }
  });
}

export function useSoftDeleteWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workerId: string) => softDeleteWorker(workerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workersKey });
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
