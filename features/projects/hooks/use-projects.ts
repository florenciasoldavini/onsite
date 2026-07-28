import { useAuth } from "@/features/auth/hooks/use-auth";
import { getProjectsMapPreview } from "@/features/projects/services/projects-map.service";
import {
  createProjectWithOptionalCover,
  getProject,
  listProjects,
  softDeleteProject,
  updateProjectWithOptionalCover
} from "@/features/projects/services/projects.service";
import type {
  CreateProjectInput,
  ProjectCoverAsset,
  ProjectFilters,
  ProjectSummary,
  StaticMapPoint,
  StaticMapViewport,
  UpdateProjectInput
} from "@/features/projects/types/project.types";
import { normalizeProjectFilters } from "@/features/projects/schemas/project.schema";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/shared/utils/pagination";
import { UserFacingError } from "@/shared/utils/user-facing-errors";
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

const projectsKey = ["projects"] as const;

export function useProjects(filters: ProjectFilters) {
  const { user } = useAuth();
  const debouncedQuery = useDebouncedValue(filters.query ?? "", 350);
  const requestFilters = useMemo(
    () => ({ ...filters, query: debouncedQuery }),
    [debouncedQuery, filters]
  );
  const normalizedFilters = useMemo(
    () => normalizeProjectFilters(requestFilters),
    [requestFilters]
  );

  return useInfiniteQuery<
    PaginatedResult<ProjectSummary>,
    Error,
    InfiniteData<PaginatedResult<ProjectSummary>>,
    readonly unknown[],
    number
  >({
    enabled: Boolean(user),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listProjects({
        filters: requestFilters,
        offset: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
        userId: user!.id,
        userRole: user!.role
      }),
    queryKey: [...projectsKey, user?.id, user?.role, normalizedFilters]
  });
}

export function useProject(projectId?: string) {
  return useQuery({
    enabled: Boolean(projectId),
    queryFn: () => getProject(projectId!),
    queryKey: [...projectsKey, "detail", projectId]
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { createUser, session, user } = useAuth();

  return useMutation({
    mutationFn: async ({
      coverAsset,
      input
    }: {
      coverAsset?: ProjectCoverAsset | null;
      input: CreateProjectInput;
    }) => {
      if (!session) {
        throw new UserFacingError("You must be signed in to save projects.");
      }

      const currentUser = user ?? (await createUser(session));

      if (!currentUser) {
        throw new UserFacingError(
          "We could not finish setting up your account. Sign out and back in, then try again."
        );
      }

      return createProjectWithOptionalCover({ coverAsset, input });
    },
    onSuccess: async ({ project }) => {
      queryClient.setQueryData([...projectsKey, "detail", project.id], project);
      await queryClient.invalidateQueries({ queryKey: projectsKey });
    }
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      coverAsset,
      input
    }: {
      coverAsset?: ProjectCoverAsset | null;
      input: UpdateProjectInput;
    }) => updateProjectWithOptionalCover({ coverAsset, input, projectId }),
    onSuccess: async ({ project }) => {
      queryClient.setQueryData([...projectsKey, "detail", project.id], project);
      await queryClient.invalidateQueries({ queryKey: projectsKey });
    }
  });
}

export function useSoftDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => softDeleteProject(projectId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectsKey });
    }
  });
}

export function useProjectsMapPreview({
  points,
  viewport
}: {
  points: StaticMapPoint[];
  viewport?: StaticMapViewport | null;
}) {
  const queryPoints = useMemo(
    () =>
      points.map((point) => ({
        label: point.label ?? "",
        latitude: point.latitude,
        longitude: point.longitude
      })),
    [points]
  );
  const queryViewport = useMemo(
    () =>
      viewport
        ? {
            centerLatitude: viewport.centerLatitude,
            centerLongitude: viewport.centerLongitude,
            zoom: viewport.zoom
          }
        : null,
    [viewport]
  );

  return useQuery({
    enabled: queryPoints.length > 0,
    queryFn: () =>
      getProjectsMapPreview({ points: queryPoints, viewport: queryViewport }),
    queryKey: ["projects-map-preview", queryPoints, queryViewport],
    retry: 1,
    staleTime: 30 * 60_000
  });
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [delayMs, value]);

  return debouncedValue;
}
