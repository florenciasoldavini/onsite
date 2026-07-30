import { PROJECT_DOCUMENT_PAGE_SIZE } from "@/features/documents/constants/document.constants";
import { normalizeDocumentFilters } from "@/features/documents/schemas/document.schema";
import {
  accessProjectDocument,
  listProjectDocuments,
  softDeleteProjectDocument,
  updateProjectDocument,
  uploadProjectDocument
} from "@/features/documents/services/documents.service";
import type {
  DocumentAccessMode,
  DocumentListFilters,
  DocumentPickerAsset,
  DocumentUploadStage,
  ProjectDocument,
  UpdateProjectDocumentInput
} from "@/features/documents/types/document";
import type { PaginatedResult } from "@/shared/utils/pagination";
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export const projectDocumentsKey = ["project-documents"] as const;

export function useProjectDocuments(
  projectId: string | undefined,
  filters: DocumentListFilters
) {
  const debouncedQuery = useDebouncedValue(filters.query ?? "", 350);
  const requestFilters = useMemo(
    () => ({ ...filters, query: debouncedQuery }),
    [debouncedQuery, filters]
  );
  const normalizedFilters = useMemo(
    () => normalizeDocumentFilters(requestFilters),
    [requestFilters]
  );

  return useInfiniteQuery<
    PaginatedResult<ProjectDocument>,
    Error,
    InfiniteData<PaginatedResult<ProjectDocument>>,
    readonly unknown[],
    number
  >({
    enabled: Boolean(projectId),
    getNextPageParam: (page) => page.nextOffset ?? undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listProjectDocuments({
        filters: requestFilters,
        offset: pageParam,
        pageSize: PROJECT_DOCUMENT_PAGE_SIZE,
        projectId: projectId!
      }),
    queryKey: [
      ...projectDocumentsKey,
      projectId,
      normalizedFilters
    ]
  });
}

export function useUploadProjectDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      asset: DocumentPickerAsset;
      category: ProjectDocument["category"];
      name: string;
      onStageChange?: (stage: DocumentUploadStage) => void;
    }) => uploadProjectDocument({ ...input, projectId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...projectDocumentsKey, projectId]
      });
    }
  });
}

export function useUpdateProjectDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      input
    }: {
      documentId: string;
      input: UpdateProjectDocumentInput;
    }) => updateProjectDocument(documentId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...projectDocumentsKey, projectId]
      });
    }
  });
}

export function useDeleteProjectDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: softDeleteProjectDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...projectDocumentsKey, projectId]
      });
    }
  });
}

export function useAccessProjectDocument() {
  return useMutation({
    mutationFn: ({
      document,
      mode
    }: {
      document: ProjectDocument;
      mode: DocumentAccessMode;
    }) => accessProjectDocument({ document, mode })
  });
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs, value]);
  return debounced;
}
