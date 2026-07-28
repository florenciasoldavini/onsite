import type { UserRole } from "@/features/auth/types/auth.types";
import {
  countClientProjectRows,
  getClientRow,
  insertClientRow,
  listClientRows,
  softDeleteClientRow,
  updateClientRow
} from "@/features/clients/repositories/clients.repository";
import type {
  ClientFilters,
  CreateClientInput,
  UpdateClientInput
} from "@/features/clients/types/client";
import type { OffsetPageRequest } from "@/shared/utils/pagination";

export function listClients({
  filters,
  offset,
  pageSize,
  userId,
  userRole
}: {
  filters?: ClientFilters;
  userId: string;
  userRole: UserRole;
} & OffsetPageRequest) {
  return listClientRows({
    filters,
    offset,
    pageSize,
    userId,
    userRole
  });
}

export function getClient(clientId: string) {
  return getClientRow(clientId);
}

export function createClient(input: CreateClientInput) {
  return insertClientRow(input);
}

export function updateClient(clientId: string, input: UpdateClientInput) {
  return updateClientRow(clientId, input);
}

export function countClientProjects(clientId: string) {
  return countClientProjectRows(clientId);
}

export function softDeleteClient(clientId: string) {
  return softDeleteClientRow(clientId);
}
