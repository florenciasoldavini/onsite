import { ProjectPhotoCard } from "@/features/photos/components/project-photo-card";
import { ProjectPhotosError } from "@/features/photos/components/project-photos/project-photos-error";
import {
  PROJECT_PHOTO_KIND_LABELS,
  PROJECT_PHOTO_KINDS
} from "@/features/photos/constants/photo.constants";
import { useProjectPhotos } from "@/features/photos/hooks/use-project-photos";
import type {
  ProjectPhoto,
  ProjectPhotoFilters,
  ProjectPhotoKind
} from "@/features/photos/types/photo";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useProjectPermission } from "@/features/projects/hooks/use-project-collaboration";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { AppHeading } from "@/shared/ui/components/heading";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SelectField } from "@/shared/ui/components/select-field";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { SegmentedTabs } from "@/shared/ui/components/tabs";
import { AppText } from "@/shared/ui/components/text";
import { atomLayout, atomSpacing } from "@/shared/ui/components/theme";
import { CameraIcon, CirclePlusIcon, RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
  View
} from "react-native";

const kindOptions = [
  { label: "All categories", value: "all" as const },
  ...PROJECT_PHOTO_KINDS.map((kind) => ({
    label: PROJECT_PHOTO_KIND_LABELS[kind],
    value: kind
  }))
];

export default function ProjectPhotosScreen({
  projectId
}: {
  projectId?: string;
}) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [kind, setKind] = useState<ProjectPhotoKind | "all">("all");
  const [marketing, setMarketing] =
    useState<ProjectPhotoFilters["marketing"]>("all");
  const projectQuery = useProject(projectId);
  const writePermission = useProjectPermission(
    projectId,
    "project.photos.write"
  );
  const photosQuery = useProjectPhotos(projectId, {
    kind,
    marketing
  });
  const photos = useMemo(
    () => photosQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [photosQuery.data]
  );
  const columns =
    width >= atomLayout.breakpointDesktop
      ? 4
      : width >= atomLayout.breakpointTablet
        ? 3
        : 2;
  const horizontalPadding =
    width >= atomLayout.breakpointDesktop
      ? atomLayout.marginDesktop
      : width >= atomLayout.breakpointTablet
        ? atomLayout.marginTablet
        : atomLayout.marginMobile;
  const usableWidth =
    Math.min(width, atomLayout.maxWidthContent) - horizontalPadding * 2;
  const cardWidth = (usableWidth - atomSpacing[4] * (columns - 1)) / columns;
  const routeProjectId = projectId ?? "";
  const backToProjects = {
    label: "Back to projects",
    onPress: () => router.replace("/projects" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: { action: backToProjects },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void projectQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            projectQuery.error,
            "We couldn't load this project. Check your connection and try again."
          )
        },
        notFound: { action: backToProjects }
      }}
      isError={projectQuery.isError}
      isInvalid={!projectId}
      isLoading={projectQuery.isLoading}
      isNotFound={!projectQuery.data}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={48} width="55%" />
            <SkeletonBlock height={420} />
          </View>
        </Screen>
      }
      resourceName="project"
    >
      <Screen contentStyle={{ flex: 1 }} scrollable={false}>
        <View style={{ flex: 1, gap: atomSpacing[5] }}>
          <Breadcrumb
            items={[
              {
                label: "Projects",
                onPress: () => router.replace("/projects" as never)
              },
              {
                label: projectQuery.data?.name ?? "Project",
                onPress: () =>
                  router.push(`/projects/${routeProjectId}` as never)
              },
              { label: "Photos" }
            ]}
          />

          <View
            style={{
              alignItems: "flex-start",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: atomSpacing[4],
              justifyContent: "space-between"
            }}
          >
            <View style={{ flexGrow: 1, gap: atomSpacing[1] }}>
              <AppText tone="accent" variant="eyebrow">
                PROJECT PHOTOS
              </AppText>
              <AppHeading selectable variant="hero">
                {projectQuery.data?.name ?? "Photos"}
              </AppHeading>
            </View>
            {writePermission.allowed ? (
              <AppButton
                fullWidth={false}
                icon={CirclePlusIcon}
                onPress={() =>
                  router.push(`/projects/${routeProjectId}/photos/new` as never)
                }
              >
                Add photos
              </AppButton>
            ) : null}
          </View>

          <View style={{ gap: atomSpacing[4] }}>
            <SelectField
              label="Category"
              onChange={setKind}
              options={kindOptions}
              value={kind}
            />
            <SegmentedTabs
              onChange={setMarketing}
              options={[
                { label: "All photos", value: "all" },
                { label: "Marketing", value: "marketing" }
              ]}
              value={marketing ?? "all"}
            />
          </View>

          {photosQuery.isLoading ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: atomSpacing[4]
              }}
            >
              {Array.from({ length: columns * 2 }).map((_, index) => (
                <SkeletonBlock
                  height={cardWidth * 1.05}
                  key={index}
                  width={cardWidth}
                />
              ))}
            </View>
          ) : photosQuery.isError ? (
            <ProjectPhotosError
              error={photosQuery.error}
              onRetry={() => void photosQuery.refetch()}
            />
          ) : photos.length === 0 ? (
            <EmptyState
              action={{
                icon: CameraIcon,
                label: "Add project photos",
                onPress: () =>
                  router.push(`/projects/${routeProjectId}/photos/new` as never)
              }}
              description={
                kind !== "all" || marketing === "marketing"
                  ? "No photos match the selected filters."
                  : "Capture progress, issues, deliveries, and other project moments."
              }
              icon={CameraIcon}
              title={
                kind !== "all" || marketing === "marketing"
                  ? "No matching photos"
                  : "No project photos yet"
              }
            />
          ) : (
            <FlatList<ProjectPhoto>
              columnWrapperStyle={{ gap: atomSpacing[4] }}
              data={photos}
              key={columns}
              keyExtractor={(photo) => photo.id}
              numColumns={columns}
              onEndReached={() => {
                if (
                  photosQuery.hasNextPage &&
                  !photosQuery.isFetchingNextPage
                ) {
                  void photosQuery.fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.4}
              renderItem={({ item }: { item: ProjectPhoto }) => (
                <View
                  style={{
                    paddingBottom: atomSpacing[4]
                  }}
                >
                  <ProjectPhotoCard
                    onPress={() =>
                      router.push(
                        `/projects/${routeProjectId}/photos/${item.id}` as never
                      )
                    }
                    photo={item}
                    width={cardWidth}
                  />
                </View>
              )}
              ListFooterComponent={
                photosQuery.isFetchingNextPage ? (
                  <ActivityIndicator accessibilityLabel="Loading more photos" />
                ) : null
              }
            />
          )}
        </View>
      </Screen>
    </RouteStateBoundary>
  );
}
