import SupplierFormScreen from "@/features/suppliers/screens/supplier-form-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function EditSupplierRoute() {
  const params = useLocalSearchParams<{ supplierId: string | string[] }>();
  const supplierId = parseRequiredUuidRouteParam(params.supplierId);

  return (
    <SupplierFormScreen mode="edit" supplierId={supplierId ?? undefined} />
  );
}
