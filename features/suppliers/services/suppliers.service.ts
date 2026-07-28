import type { UserRole } from "@/features/auth/types/auth.types";
import {
  getSupplierRow,
  insertSupplierRow,
  listSupplierRows,
  softDeleteSupplierRow,
  updateSupplierRow
} from "@/features/suppliers/repositories/suppliers.repository";
import type {
  CreateSupplierInput,
  SupplierFilters,
  UpdateSupplierInput
} from "@/features/suppliers/types/supplier";
import type { OffsetPageRequest } from "@/shared/utils/pagination";

export function listSuppliers({
  filters,
  offset,
  pageSize,
  userId,
  userRole
}: {
  filters?: SupplierFilters;
  userId: string;
  userRole: UserRole;
} & OffsetPageRequest) {
  return listSupplierRows({
    filters,
    offset,
    pageSize,
    userId,
    userRole
  });
}

export function getSupplier(supplierId: string) {
  return getSupplierRow(supplierId);
}

export function createSupplier(input: CreateSupplierInput) {
  return insertSupplierRow(input);
}

export function updateSupplier(
  supplierId: string,
  input: UpdateSupplierInput
) {
  return updateSupplierRow(supplierId, input);
}

export function softDeleteSupplier(supplierId: string) {
  return softDeleteSupplierRow(supplierId);
}
