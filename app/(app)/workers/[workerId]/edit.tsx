import WorkerFormScreen from "@/features/workers/screens/worker-form-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function EditWorkerRoute() {
  const params = useLocalSearchParams<{ workerId: string | string[] }>();
  const workerId = parseRequiredUuidRouteParam(params.workerId);

  return <WorkerFormScreen mode="edit" workerId={workerId ?? undefined} />;
}
