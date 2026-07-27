import {
  getContractorRow,
  insertContractorRow,
  listContractorRows,
  softDeleteContractorRow,
  updateContractorRow
} from "@/features/contractors/repositories/contractors.repository";
import type {
  ContractorFilters,
  CreateContractorInput,
  UpdateContractorInput
} from "@/features/contractors/types/contractor";
import type { OffsetPageRequest } from "@/shared/utils/pagination";

export function listContractors({
  filters,
  offset,
  pageSize,
  userId,
  userRole
}: {
  filters?: ContractorFilters;
  userId: string;
  userRole: "admin" | "user";
} & OffsetPageRequest) {
  return listContractorRows({
    filters,
    offset,
    pageSize,
    userId,
    userRole
  });
}

export function getContractor(contractorId: string) {
  return getContractorRow(contractorId);
}

export function createContractor(input: CreateContractorInput) {
  return insertContractorRow(input);
}

export function updateContractor(
  contractorId: string,
  input: UpdateContractorInput
) {
  return updateContractorRow(contractorId, input);
}

export function softDeleteContractor(contractorId: string) {
  return softDeleteContractorRow(contractorId);
}
