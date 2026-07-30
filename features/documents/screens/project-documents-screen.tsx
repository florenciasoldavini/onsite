import {
  DocumentCard,
  getCategoryLabel
} from "@/features/documents/components/document-card";
import { DocumentEditDialog } from "@/features/documents/components/document-edit-dialog";
import { PROJECT_DOCUMENT_CATEGORIES } from "@/features/documents/constants/document.constants";
import {
  useAccessProjectDocument,
  useDeleteProjectDocument,
  useProjectDocuments,
  useUpdateProjectDocument
} from "@/features/documents/hooks/use-project-documents";
import { toDocumentUpdateInput } from "@/features/documents/schemas/document.schema";
import type {
  DocumentAccessMode,
  DocumentFormValues,
  DocumentListFilters,
  ProjectDocument
} from "@/features/documents/types/document";
import { useProjectPermission } from "@/features/projects/hooks/use-project-collaboration";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import {
  DestructiveConfirmationDialog,
  useDestructiveConfirmation
} from "@/shared/ui/components/destructive-confirmation-dialog";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { InlineErrorState } from "@/shared/ui/components/inline-error-state";
import { SearchField } from "@/shared/ui/components/input";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SelectMenu } from "@/shared/ui/components/select-menu";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { useAppToast } from "@/shared/ui/components/toast";
import { atomSpacing } from "@/shared/ui/components/theme";
import {
  FileTextIcon,
  FilterIcon,
  PlusIcon,
  RefreshIcon
} from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View, type ListRenderItemInfo } from "react-native";

export default function ProjectDocumentsScreen({
  projectId
}: {
  projectId?: string;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/documents");
  const { t: tShared } = useTranslation("shared");
  const toast = useAppToast();
  const { isCompact, isExpanded } = useLayoutMode();
  const routeProjectId = projectId ?? "";
  const projectQuery = useProject(projectId);
  const writePermission = useProjectPermission(
    projectId,
    "project.documents.write"
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState<DocumentListFilters["category"]>("all");
  const filters = useMemo(() => ({ category, query }), [category, query]);
  const documentsQuery = useProjectDocuments(projectId, filters);
  const documents = useMemo(
    () => documentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [documentsQuery.data]
  );
  const updateMutation = useUpdateProjectDocument(routeProjectId);
  const deleteMutation = useDeleteProjectDocument(routeProjectId);
  const accessMutation = useAccessProjectDocument();
  const deleteConfirmation = useDestructiveConfirmation();
  const [editingDocument, setEditingDocument] =
    useState<ProjectDocument | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingDocument, setDeletingDocument] =
    useState<ProjectDocument | null>(null);
  const [accessing, setAccessing] = useState<{
    documentId: string;
    mode: DocumentAccessMode;
  } | null>(null);
  const columns = isExpanded ? 2 : 1;
  const categoryOptions = [
    {
      label: t(($) => $["features/documents"].categories.all),
      value: "all" as const
    },
    ...PROJECT_DOCUMENT_CATEGORIES.map((value) => ({
      label: getCategoryLabel(value, t),
      value
    }))
  ];
  const hasFilters = query.trim().length > 0 || category !== "all";

  const accessDocument = useCallback(
    async (document: ProjectDocument, mode: DocumentAccessMode) => {
      setAccessing({ documentId: document.id, mode });
      try {
        await accessMutation.mutateAsync({ document, mode });
      } catch (error) {
        toast.show({
          description: getUserFacingErrorMessage(
            error,
            t(($) => $["features/documents"].errors.access)
          ),
          title: t(($) => $["features/documents"].list.title),
          tone: "error"
        });
      } finally {
        setAccessing(null);
      }
    },
    [accessMutation, t, toast]
  );

  const saveEdit = async (values: DocumentFormValues) => {
    if (!editingDocument) return;
    setEditError(null);
    try {
      const saved = await updateMutation.mutateAsync({
        documentId: editingDocument.id,
        input: toDocumentUpdateInput(values)
      });
      setEditingDocument(null);
      toast.show({
        description: t(
          ($) => $["features/documents"].toast.updatedDescription,
          { name: saved.name }
        ),
        title: t(($) => $["features/documents"].toast.updatedTitle),
        tone: "success"
      });
    } catch (error) {
      setEditError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/documents"].errors.update)
        )
      );
    }
  };

  const confirmDelete = async () => {
    if (!deletingDocument) return;
    deleteConfirmation.clearError();
    try {
      await deleteMutation.mutateAsync(deletingDocument.id);
      const deletedName = deletingDocument.name;
      deleteConfirmation.close();
      setDeletingDocument(null);
      toast.show({
        description: t(
          ($) => $["features/documents"].toast.deletedDescription,
          { name: deletedName }
        ),
        title: t(($) => $["features/documents"].toast.deletedTitle),
        tone: "success"
      });
    } catch (error) {
      deleteConfirmation.setError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/documents"].errors.delete)
        )
      );
    }
  };

  const renderDocument = useCallback(
    ({ item }: ListRenderItemInfo<ProjectDocument>) => (
      <View
        style={{
          flex: 1 / columns,
          maxWidth: `${100 / columns}%`,
          padding: atomSpacing[2]
        }}
      >
        <DocumentCard
          accessingMode={
            accessing?.documentId === item.id ? accessing.mode : null
          }
          canWrite={writePermission.allowed}
          document={item}
          onAccess={(mode) => void accessDocument(item, mode)}
          onDelete={() => {
            setDeletingDocument(item);
            deleteConfirmation.open();
          }}
          onEdit={() => {
            setEditError(null);
            setEditingDocument(item);
          }}
        />
      </View>
    ),
    [
      accessDocument,
      accessing,
      columns,
      deleteConfirmation,
      writePermission.allowed
    ]
  );

  const loadMore = useCallback(() => {
    if (documentsQuery.hasNextPage && !documentsQuery.isFetchingNextPage) {
      void documentsQuery.fetchNextPage();
    }
  }, [documentsQuery]);

  const backToProjects = {
    label: t(($) => $["features/documents"].actions.backProjects),
    onPress: () => router.replace("/projects" as never)
  };
  const routeLoading =
    projectQuery.isLoading || writePermission.isLoading;
  const routeError = projectQuery.isError || writePermission.isError;

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: { action: backToProjects, icon: FileTextIcon },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: tShared(($) => $.shared.actions.retry),
            onPress: () =>
              void Promise.all([
                projectQuery.refetch(),
                writePermission.refetch()
              ])
          },
          description: getUserFacingErrorMessage(
            projectQuery.error ?? writePermission.error,
            t(($) => $["features/documents"].errors.loadList)
          ),
          icon: FileTextIcon
        },
        notFound: { action: backToProjects, icon: FileTextIcon }
      }}
      isError={routeError}
      isInvalid={!projectId}
      isLoading={routeLoading}
      isNotFound={!projectQuery.data}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={44} width="55%" />
            <SkeletonBlock height={420} />
          </View>
        </Screen>
      }
      resourceName="project"
    >
      <Screen
        floatingAction={
          documents.length > 0 && isCompact && writePermission.allowed ? (
            <AppButton
              accessibilityLabel={t(
                ($) => $["features/documents"].accessibility.upload
              )}
              icon={PlusIcon}
              layout="icon"
              onPress={() =>
                router.push(
                  `/projects/${routeProjectId}/documents/new` as never
                )
              }
              shape="pill"
            />
          ) : null
        }
        scrollable={false}
      >
        <FlatList
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: atomSpacing[10]
          }}
          data={documents}
          key={`project-documents-${columns}`}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            documentsQuery.isLoading ? (
              <View style={{ gap: atomSpacing[4], padding: atomSpacing[2] }}>
                {[0, 1, 2].map((item) => (
                  <SkeletonBlock height={220} key={item} />
                ))}
              </View>
            ) : documentsQuery.isError ? (
              <InlineErrorState
                action={{
                  icon: RefreshIcon,
                  label: tShared(($) => $.shared.actions.retry),
                  onPress: () => void documentsQuery.refetch()
                }}
                description={getUserFacingErrorMessage(
                  documentsQuery.error,
                  t(($) => $["features/documents"].errors.loadList)
                )}
                icon={FileTextIcon}
                title={t(
                  ($) => $["features/documents"].errors.listUnavailable
                )}
              />
            ) : (
              <EmptyState
                action={
                  hasFilters
                    ? {
                        label: t(
                          ($) =>
                            $["features/documents"].actions.clearFilters
                        ),
                        onPress: () => {
                          setCategory("all");
                          setQuery("");
                        }
                      }
                    : writePermission.allowed
                      ? {
                          icon: PlusIcon,
                          label: t(
                            ($) => $["features/documents"].actions.add
                          ),
                          onPress: () =>
                            router.push(
                              `/projects/${routeProjectId}/documents/new` as never
                            )
                        }
                      : undefined
                }
                description={
                  hasFilters
                    ? t(
                        ($) =>
                          $["features/documents"].list.filteredDescription
                      )
                    : writePermission.allowed
                      ? t(
                          ($) =>
                            $["features/documents"].list.emptyDescription
                        )
                      : t(
                          ($) =>
                            $["features/documents"].list
                              .emptyReadOnlyDescription
                        )
                }
                icon={FileTextIcon}
                title={
                  hasFilters
                    ? t(
                        ($) => $["features/documents"].list.filteredTitle
                      )
                    : t(($) => $["features/documents"].list.emptyTitle)
                }
              />
            )
          }
          ListFooterComponent={
            documentsQuery.hasNextPage ? (
              <View style={{ padding: atomSpacing[4] }}>
                <AppButton
                  color="neutral"
                  loading={documentsQuery.isFetchingNextPage}
                  onPress={loadMore}
                  size="sm"
                  variant="bordered"
                >
                  {t(($) => $["features/documents"].actions.loadMore)}
                </AppButton>
              </View>
            ) : null
          }
          ListHeaderComponent={
            <View
              style={{ gap: atomSpacing[6], paddingBottom: atomSpacing[4] }}
            >
              <Breadcrumb
                items={[
                  {
                    label: t(($) => $["features/documents"].list.project),
                    onPress: () => router.replace("/projects" as never)
                  },
                  {
                    label:
                      projectQuery.data?.name ??
                      t(($) => $["features/documents"].list.project),
                    onPress: () =>
                      router.push(`/projects/${routeProjectId}` as never)
                  },
                  {
                    label: t(($) => $["features/documents"].list.title)
                  }
                ]}
              />
              <NavScreenHeader
                action={
                  !isCompact && writePermission.allowed ? (
                    <AppButton
                      fullWidth={false}
                      icon={PlusIcon}
                      iconAfter={false}
                      onPress={() =>
                        router.push(
                          `/projects/${routeProjectId}/documents/new` as never
                        )
                      }
                      size="sm"
                    >
                      {t(($) => $["features/documents"].actions.add)}
                    </AppButton>
                  ) : null
                }
                description={t(
                  ($) => $["features/documents"].list.description
                )}
                showBreadcrumb={false}
                title={t(($) => $["features/documents"].list.title)}
              />
              <View
                style={{
                  alignItems: isExpanded ? "center" : "stretch",
                  flexDirection: isExpanded ? "row" : "column",
                  gap: atomSpacing[3]
                }}
              >
                <View style={{ flex: 1 }}>
                  <SearchField
                    onChangeText={setQuery}
                    placeholder={t(
                      ($) =>
                        $["features/documents"].list.searchPlaceholder
                    )}
                    value={query}
                  />
                </View>
                <SelectMenu
                  accessibilityLabel={t(
                    ($) =>
                      $["features/documents"].accessibility.categoryFilter
                  )}
                  icon={FilterIcon}
                  labelPrefix={t(
                    ($) => $["features/documents"].list.category
                  )}
                  onChange={setCategory}
                  options={categoryOptions}
                  value={category ?? "all"}
                />
              </View>
            </View>
          }
          numColumns={columns}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          renderItem={renderDocument}
          showsVerticalScrollIndicator={false}
        />
      </Screen>

      <DocumentEditDialog
        document={editingDocument}
        error={editError}
        isPending={updateMutation.isPending}
        onClose={() => {
          if (!updateMutation.isPending) setEditingDocument(null);
        }}
        onSave={saveEdit}
      />
      <DestructiveConfirmationDialog
        accessibilityLabel={t(
          ($) => $["features/documents"].accessibility.cancelDelete
        )}
        confirmLabel={t(($) => $["features/documents"].actions.delete)}
        controller={deleteConfirmation}
        description={t(($) => $["features/documents"].delete.description)}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        title={t(($) => $["features/documents"].delete.title, {
          name: deletingDocument?.name ?? ""
        })}
      />
    </RouteStateBoundary>
  );
}
