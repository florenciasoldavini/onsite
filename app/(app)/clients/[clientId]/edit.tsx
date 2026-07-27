import ClientFormScreen from "@/features/clients/screens/client-form-screen";
import { useLocalSearchParams } from "expo-router";

export default function EditClientRoute() {
  const params = useLocalSearchParams<{ clientId: string }>();
  const clientId = Array.isArray(params.clientId)
    ? params.clientId[0]
    : params.clientId;

  return <ClientFormScreen clientId={clientId} mode="edit" />;
}
