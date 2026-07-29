import ContractorFormScreen from "@/features/contractors/screens/contractor-form-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function EditContractorRoute() {
  const params = useLocalSearchParams<{
    contractorId: string | string[];
  }>();
  const contractorId = parseRequiredUuidRouteParam(params.contractorId);

  return (
    <ContractorFormScreen
      contractorId={contractorId ?? undefined}
      mode="edit"
    />
  );
}
