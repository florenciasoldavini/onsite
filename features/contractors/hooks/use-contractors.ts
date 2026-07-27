import { useAuth } from "@/features/auth/hooks/use-auth";
import { normalizeContractorFilters } from "@/features/contractors/schemas/contractor.schema";
import {
  createContractor,
  getContractor,
  listContractors,
  softDeleteContractor,
  updateContractor
} from "@/features/contractors/services/contractors.service";
import type {
  ContractorFilters,
  ContractorSummary,
  CreateContractorInput,
  UpdateContractorInput
} from "@/features/contractors/types/contractor";
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

export const contractorsKey = ["contractors"] as const;

export function useContractors(filters: ContractorFilters = {}) {
  const { user } = useAuth();
  const debouncedQuery = useDebouncedValue(filters.query ?? "", 350);
  const requestFilters = useMemo(
    () => ({ ...filters, query: debouncedQuery }),
    [debouncedQuery, filters]
  );
  const normalizedFilters = useMemo(
    () => normalizeContractorFilters(requestFilters),
    [requestFilters]
  );

  return useInfiniteQuery<
    PaginatedResult<ContractorSummary>,
    Error,
    InfiniteData<PaginatedResult<ContractorSummary>>,
    readonly unknown[],
    number
  >({
    enabled: Boolean(user),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listContractors({
        filters: requestFilters,
        offset: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
        userId: user!.id,
        userRole: user!.role
      }),
    queryKey: [
      ...contractorsKey,
      user?.id,
      user?.role,
      normalizedFilters
    ]
  });
}

export function useContractor(contractorId?: string) {
  return useQuery({
    enabled: Boolean(contractorId),
    queryFn: () => getContractor(contractorId!),
    queryKey: [...contractorsKey, "detail", contractorId]
  });
}

export function useCreateContractor() {
  const { createUser, session, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContractorInput) => {
      if (!session) {
        throw new UserFacingError(
          "You must be signed in to save contractors."
        );
      }

      const currentUser = user ?? (await createUser(session));

      if (!currentUser) {
        throw new UserFacingError(
          "We could not finish setting up your account. Sign out and back in, then try again."
        );
      }

      return createContractor(input);
    },
    onSuccess: async (contractor) => {
      queryClient.setQueryData(
        [...contractorsKey, "detail", contractor.id],
        contractor
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contractorsKey }),
        queryClient.invalidateQueries({ queryKey: ["workers"] })
      ]);
    }
  });
}

export function useUpdateContractor(contractorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateContractorInput) =>
      updateContractor(contractorId, input),
    onSuccess: async (contractor) => {
      queryClient.setQueryData(
        [...contractorsKey, "detail", contractor.id],
        contractor
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contractorsKey }),
        queryClient.invalidateQueries({ queryKey: ["workers"] })
      ]);
    }
  });
}

export function useSoftDeleteContractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractorId: string) =>
      softDeleteContractor(contractorId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contractorsKey }),
        queryClient.invalidateQueries({ queryKey: ["workers"] })
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

    return () => {
      clearTimeout(timeout);
    };
  }, [delayMs, value]);

  return debouncedValue;
}
