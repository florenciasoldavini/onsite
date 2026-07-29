import type {
  Contractor,
  ContractorFormValues
} from "@/features/contractors/types/contractor";

export function getContractorFormValues(
  contractor: Contractor
): ContractorFormValues {
  return {
    email: contractor.email ?? "",
    first_name: contractor.first_name,
    last_name: contractor.last_name ?? "",
    phone_number: contractor.phone_number ?? ""
  };
}
