import { useAuth } from "@/features/auth/hooks/use-auth";
import { PROJECT_PHOTO_PAGE_SIZE } from "@/features/photos/constants/photo.constants";
import { normalizeProjectPhotoFilters } from "@/features/photos/schemas/photo.schema";
import {
  getProjectPhoto,
  listProjectPhotos,
  softDeleteProjectPhoto,
  updateProjectPhoto,
  uploadProjectPhotoBatch,
  type ProjectPhotoUploadStage
} from "@/features/photos/services/photos.service";
import type {
  ProjectPhoto,
  ProjectPhotoDraft,
  ProjectPhotoFilters,
  UpdateProjectPhotoInput
} from "@/features/photos/types/photo";
import type { PaginatedResult } from "@/shared/utils/pagination";
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useMemo } from "react";

const projectPhotosKey = ["project-photos"] as const;

export function useProjectPhotos(
  projectId: string | undefined,
  filters: ProjectPhotoFilters
) {
  const { user } = useAuth();
  const normalizedFilters = useMemo(
    () => normalizeProjectPhotoFilters(filters),
    [filters]
  );

  return useInfiniteQuery<
    PaginatedResult<ProjectPhoto>,
    Error,
    InfiniteData<PaginatedResult<ProjectPhoto>>,
    readonly unknown[],
    number
  >({
    enabled: Boolean(projectId && user),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listProjectPhotos({
        filters: normalizedFilters,
        offset: pageParam,
        pageSize: PROJECT_PHOTO_PAGE_SIZE,
        projectId: projectId!,
        userId: user!.id,
        userRole: user!.role
      }),
    queryKey: [
      ...projectPhotosKey,
      projectId,
      user?.id,
      user?.role,
      normalizedFilters
    ]
  });
}
export function useProjectPhoto(photoId?: string) {
  return useQuery({
    enabled: Boolean(photoId),
    queryFn: () => getProjectPhoto(photoId!),
    queryKey: [...projectPhotosKey, "detail", photoId]
  });
}

export function useUploadProjectPhotos(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      drafts,
      onStageChange
    }: {
      drafts: ProjectPhotoDraft[];
      onStageChange?: (
        photoId: string,
        stage: ProjectPhotoUploadStage
      ) => void;
    }) =>
      uploadProjectPhotoBatch({ drafts, onStageChange, projectId }),
    onSuccess: async (outcomes) => {
      for (const outcome of outcomes) {
        if (outcome.photo) {
          queryClient.setQueryData(
            [...projectPhotosKey, "detail", outcome.photo.id],
            outcome.photo
          );
        }
      }

      await queryClient.invalidateQueries({
        queryKey: [...projectPhotosKey, projectId]
      });
    }
  });
}

export function useUpdateProjectPhoto(photoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProjectPhotoInput) =>
      updateProjectPhoto(photoId, input),
    onSuccess: async (photo) => {
      queryClient.setQueryData(
        [...projectPhotosKey, "detail", photoId],
        photo
      );
      await queryClient.invalidateQueries({
        queryKey: projectPhotosKey
      });
    }
  });
}

export function useSoftDeleteProjectPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => softDeleteProjectPhoto(photoId),
    onSuccess: async (_result, photoId) => {
      queryClient.removeQueries({
        queryKey: [...projectPhotosKey, "detail", photoId]
      });
      await queryClient.invalidateQueries({
        queryKey: projectPhotosKey
      });
    }
  });
}
