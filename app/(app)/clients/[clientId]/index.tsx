import ClientDetailScreen from "@/features/clients/screens/client-detail-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function ClientDetailRoute() {
  const params = useLocalSearchParams<{ clientId: string | string[] }>();
  const clientId = parseRequiredUuidRouteParam(params.clientId);

  return <ClientDetailScreen clientId={clientId ?? undefined} />;
}
