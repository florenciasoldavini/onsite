import { ProjectPhotoDetailContent } from "@/features/photos/components/project-photo-detail/project-photo-detail-content";
import { useProjectPhoto } from "@/features/photos/hooks/use-project-photos";
import { useProjectPermission } from "@/features/projects/hooks/use-project-collaboration";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { atomSpacing } from "@/shared/ui/components/theme";
import { RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { View } from "react-native";

export default function ProjectPhotoDetailScreen({
  photoId,
  projectId
}: {
  photoId?: string;
  projectId?: string;
}) {
  const router = useRouter();
  const photoQuery = useProjectPhoto(photoId);
  const writePermission = useProjectPermission(
    projectId,
    "project.photos.write"
  );
  const isMatchingPhoto =
    Boolean(photoQuery.data) && photoQuery.data?.project_id === projectId;

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: {
          action: {
            label: "Back to projects",
            onPress: () => router.replace("/projects" as never)
          }
        },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => {
              void Promise.all([
                photoQuery.refetch(),
                writePermission.refetch()
              ]);
            }
          },
          description: photoQuery.isError
            ? getUserFacingErrorMessage(
                photoQuery.error,
                "We couldn't load this photo. Check your connection and try again."
              )
            : "We couldn't verify your photo access. Check your connection and try again."
        },
        notFound: {
          action: projectId
            ? {
                label: "Back to photos",
                onPress: () =>
                  router.replace(`/projects/${projectId}/photos` as never)
              }
            : undefined,
          description:
            "This photo may have been removed or you may not have access."
        }
      }}
      isError={
        photoQuery.isError || (isMatchingPhoto && writePermission.isError)
      }
      isInvalid={!projectId || !photoId}
      isLoading={photoQuery.isLoading || writePermission.isLoading}
      isNotFound={!isMatchingPhoto}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={24} width="35%" />
            <SkeletonBlock height={420} />
            <SkeletonBlock height={260} />
          </View>
        </Screen>
      }
      resourceName="photo"
    >
      {photoQuery.data && projectId && photoId && isMatchingPhoto ? (
        <ProjectPhotoDetailContent
          canWrite={writePermission.allowed}
          photo={photoQuery.data}
          photoId={photoId}
          projectId={projectId}
        />
      ) : null}
    </RouteStateBoundary>
  );
}
