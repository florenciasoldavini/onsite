import ContractorDetailScreen from "@/features/contractors/screens/contractor-detail-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function ContractorDetailRoute() {
  const params = useLocalSearchParams<{
    contractorId: string | string[];
  }>();
  const contractorId = parseRequiredUuidRouteParam(params.contractorId);

  return <ContractorDetailScreen contractorId={contractorId ?? undefined} />;
}
