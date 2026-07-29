import ClientFormScreen from "@/features/clients/screens/client-form-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function EditClientRoute() {
  const params = useLocalSearchParams<{ clientId: string | string[] }>();
  const clientId = parseRequiredUuidRouteParam(params.clientId);

  return <ClientFormScreen clientId={clientId ?? undefined} mode="edit" />;
}
