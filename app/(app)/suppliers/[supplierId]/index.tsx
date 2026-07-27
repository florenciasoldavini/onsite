import SupplierDetailScreen from "@/features/suppliers/screens/supplier-detail-screen";
import { useLocalSearchParams } from "expo-router";

export default function SupplierDetailRoute() {
  const params = useLocalSearchParams<{ supplierId: string }>();
  const supplierId = Array.isArray(params.supplierId)
    ? params.supplierId[0]
    : params.supplierId;

  return <SupplierDetailScreen supplierId={supplierId} />;
}
