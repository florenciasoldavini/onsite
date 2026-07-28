import type { UserRole } from "@/features/auth/types/auth.types";
import { buildSupplierListQueryPlan } from "@/features/suppliers/repositories/supplier-list-query";
import type {
  CreateSupplierInput,
  Supplier,
  SupplierFilters,
  SupplierSummary,
  UpdateSupplierInput
} from "@/features/suppliers/types/supplier";
import {
  requireSupabase,
  toRepositoryError
} from "@/infrastructure/supabase/repository";
import {
  getOffsetPageRange,
  toPaginatedResult,
  type OffsetPageRequest
} from "@/shared/utils/pagination";
import { UserFacingError } from "@/shared/utils/user-facing-errors";

const SUPPLIER_SUMMARY_COLUMNS = [
  "address",
  "contact_name",
  "email",
  "id",
  "name",
  "owner_id",
  "phone_number",
  "website_url"
].join(",");

export async function listSupplierRows({
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
  const client = requireSupabase();
  const plan = buildSupplierListQueryPlan({ filters, userId, userRole });
  const range = getOffsetPageRange({ offset, pageSize });
  let query = client.from("suppliers").select(SUPPLIER_SUMMARY_COLUMNS);

  for (const filter of plan.filters) {
    if (filter.operator === "eq") {
      query = query.eq(filter.column, filter.value as string);
    } else if (filter.operator === "is") {
      query = query.is(filter.column, filter.value);
    } else {
      query = query.or(filter.value as string);
    }
  }

  for (const order of plan.orders) {
    query = query.order(order.column, { ascending: order.ascending });
  }

  const { data, error } = await query.range(range.from, range.to);
  if (error) throw toRepositoryError(error);

  return toPaginatedResult(
    (data ?? []) as unknown as SupplierSummary[],
    range
  );
}

export async function getSupplierRow(supplierId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("suppliers")
    .select("*")
    .eq("id", supplierId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw toRepositoryError(error);
  return data ? (data as Supplier) : null;
}

export async function insertSupplierRow(input: CreateSupplierInput) {
  const client = requireSupabase();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) throw toRepositoryError(authError);
  if (!user) {
    throw new UserFacingError("You must be signed in to save suppliers.");
  }

  const { data, error } = await client
    .from("suppliers")
    .insert({ ...input, owner_id: user.id })
    .select()
    .single();

  if (error) throw toRepositoryError(error);
  return data as Supplier;
}

export async function updateSupplierRow(
  supplierId: string,
  input: UpdateSupplierInput
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("suppliers")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", supplierId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) throw toRepositoryError(error);
  return data as Supplier;
}

export async function softDeleteSupplierRow(supplierId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from("suppliers")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", supplierId)
    .is("deleted_at", null);

  if (error) throw toRepositoryError(error);
}
