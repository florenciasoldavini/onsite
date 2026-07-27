import ContractorFormScreen from "@/features/contractors/screens/contractor-form-screen";
import { useLocalSearchParams } from "expo-router";

export default function EditContractor() {
  const params = useLocalSearchParams<{ contractorId: string }>();
  const contractorId = Array.isArray(params.contractorId)
    ? params.contractorId[0]
    : params.contractorId;

  return <ContractorFormScreen contractorId={contractorId} mode="edit" />;
}
