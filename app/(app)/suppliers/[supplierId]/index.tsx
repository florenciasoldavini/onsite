import SupplierDetailScreen from "@/features/suppliers/screens/supplier-detail-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function SupplierDetailRoute() {
  const params = useLocalSearchParams<{ supplierId: string | string[] }>();
  const supplierId = parseRequiredUuidRouteParam(params.supplierId);

  return <SupplierDetailScreen supplierId={supplierId ?? undefined} />;
}
