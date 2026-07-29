import { WorkerDetailContent } from "@/features/workers/components/worker-detail/worker-detail-content";
import { useWorker } from "@/features/workers/hooks/use-workers";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { atomSpacing } from "@/shared/ui/components/theme";
import { RefreshIcon, UserIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { View } from "react-native";

export default function WorkerDetailScreen({
  workerId
}: {
  workerId?: string;
}) {
  const router = useRouter();
  const workerQuery = useWorker(workerId);
  const backToDirectory = {
    label: "Back to directory",
    onPress: () => router.replace("/directory?section=workers" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: { action: backToDirectory, icon: UserIcon },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void workerQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            workerQuery.error,
            "We couldn't load this worker. Try again."
          ),
          icon: UserIcon
        },
        notFound: { action: backToDirectory, icon: UserIcon }
      }}
      isError={workerQuery.isError}
      isInvalid={!workerId}
      isLoading={workerQuery.isLoading}
      isNotFound={!workerQuery.data}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={48} width="55%" />
            <SkeletonBlock height={320} />
          </View>
        </Screen>
      }
      resourceName="worker"
    >
      {workerQuery.data ? (
        <WorkerDetailContent worker={workerQuery.data} />
      ) : null}
    </RouteStateBoundary>
  );
}
