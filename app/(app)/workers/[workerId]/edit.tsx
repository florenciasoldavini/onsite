import WorkerFormScreen from "@/features/workers/screens/worker-form-screen";
import { useLocalSearchParams } from "expo-router";

export default function EditWorkerRoute() {
  const params = useLocalSearchParams<{ workerId: string }>();
  const workerId = Array.isArray(params.workerId)
    ? params.workerId[0]
    : params.workerId;

  return <WorkerFormScreen mode="edit" workerId={workerId} />;
}
