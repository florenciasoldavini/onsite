import { useAuth } from "@/features/auth/hooks/use-auth";
import { normalizeSupplierFilters } from "@/features/suppliers/schemas/supplier.schema";
import {
  createSupplier,
  getSupplier,
  listSuppliers,
  softDeleteSupplier,
  updateSupplier
} from "@/features/suppliers/services/suppliers.service";
import type {
  CreateSupplierInput,
  SupplierFilters,
  SupplierSummary,
  UpdateSupplierInput
} from "@/features/suppliers/types/supplier";
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

export const suppliersKey = ["suppliers"] as const;

export function useSuppliers(filters: SupplierFilters = {}) {
  const { user } = useAuth();
  const debouncedQuery = useDebouncedValue(filters.query ?? "", 350);
  const requestFilters = useMemo(
    () => ({ ...filters, query: debouncedQuery }),
    [debouncedQuery, filters]
  );
  const normalizedFilters = useMemo(
    () => normalizeSupplierFilters(requestFilters),
    [requestFilters]
  );

  return useInfiniteQuery<
    PaginatedResult<SupplierSummary>,
    Error,
    InfiniteData<PaginatedResult<SupplierSummary>>,
    readonly unknown[],
    number
  >({
    enabled: Boolean(user),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listSuppliers({
        filters: requestFilters,
        offset: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
        userId: user!.id,
        userRole: user!.role
      }),
    queryKey: [...suppliersKey, user?.id, user?.role, normalizedFilters]
  });
}

export function useSupplier(supplierId?: string) {
  return useQuery({
    enabled: Boolean(supplierId),
    queryFn: () => getSupplier(supplierId!),
    queryKey: [...suppliersKey, "detail", supplierId]
  });
}

export function useCreateSupplier() {
  const { createUser, session, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSupplierInput) => {
      if (!session) {
        throw new UserFacingError("You must be signed in to save suppliers.");
      }

      const currentUser = user ?? (await createUser(session));
      if (!currentUser) {
        throw new UserFacingError(
          "We could not finish setting up your account. Sign out and back in, then try again."
        );
      }

      return createSupplier(input);
    },
    onSuccess: async (supplier) => {
      queryClient.setQueryData(
        [...suppliersKey, "detail", supplier.id],
        supplier
      );
      await queryClient.invalidateQueries({ queryKey: suppliersKey });
    }
  });
}

export function useUpdateSupplier(supplierId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSupplierInput) =>
      updateSupplier(supplierId, input),
    onSuccess: async (supplier) => {
      queryClient.setQueryData(
        [...suppliersKey, "detail", supplier.id],
        supplier
      );
      await queryClient.invalidateQueries({ queryKey: suppliersKey });
    }
  });
}

export function useSoftDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplierId: string) => softDeleteSupplier(supplierId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: suppliersKey });
    }
  });
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
}
