import SupplierFormScreen from "@/features/suppliers/screens/supplier-form-screen";
import { useLocalSearchParams } from "expo-router";

export default function EditSupplierRoute() {
  const params = useLocalSearchParams<{ supplierId: string }>();
  const supplierId = Array.isArray(params.supplierId)
    ? params.supplierId[0]
    : params.supplierId;

  return <SupplierFormScreen mode="edit" supplierId={supplierId} />;
}
