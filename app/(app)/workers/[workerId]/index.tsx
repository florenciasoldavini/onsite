import WorkerDetailScreen from "@/features/workers/screens/worker-detail-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function WorkerDetailRoute() {
  const params = useLocalSearchParams<{ workerId: string | string[] }>();
  const workerId = parseRequiredUuidRouteParam(params.workerId);

  return <WorkerDetailScreen workerId={workerId ?? undefined} />;
}
