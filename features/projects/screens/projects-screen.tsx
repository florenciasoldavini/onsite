import { AppButton } from "@/shared/ui/components/button";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { InlineErrorState } from "@/shared/ui/components/inline-error-state";
import { SearchField } from "@/shared/ui/components/input";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { Screen } from "@/shared/ui/components/screen";
import { SelectMenu } from "@/shared/ui/components/select-menu";
import { SegmentedTabs } from "@/shared/ui/components/tabs";
import { atomLayout, atomSpacing } from "@/shared/ui/components/theme";
import { ProjectCardSkeleton } from "@/features/projects/components/project-card-skeleton";
import {
  ProjectsTable,
  ProjectsTableSkeleton
} from "@/features/projects/components/projects-table";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import {
  getActiveFilterCount,
  getProjectGridMetrics,
  initialProjectFilters,
  projectSortOptions,
  projectViewOptions,
  type ProjectFilterState,
  type ProjectsViewMode
} from "@/features/projects/components/projects-screen/projects-screen.config";
import { projectsScreenStyles as styles } from "@/features/projects/components/projects-screen/projects-screen.styles";
import {
  ProjectFiltersModal,
  ProjectListItem,
  ProjectRowSeparator,
  ProjectsPaginationFooter
} from "@/features/projects/components/projects-screen/projects-screen-support";
import { useProjects } from "@/features/projects/hooks/use-projects";
import type {
  ProjectSort,
  ProjectSummary
} from "@/features/projects/types/project.types";
import {
  FilterIcon,
  FolderPlusIcon,
  MailIcon,
  RefreshIcon,
  SortIcon
} from "@/shared/ui/icons";
import { useRouter } from "expo-router";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  View,
  useWindowDimensions,
  type ListRenderItemInfo
} from "react-native";

const ProjectsMapView = lazy(async () => {
  const module = await import(
    "@/features/projects/components/projects-map-view"
  );

  return { default: module.ProjectsMapView };
});

export default function ProjectsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isCompact, isExpanded } = useLayoutMode();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProjectSort>("created_desc");
  const [viewMode, setViewMode] = useState<ProjectsViewMode>("list");
  const [filters, setFilters] = useState<ProjectFilterState>(
    initialProjectFilters
  );
  const [filtersVisible, setFiltersVisible] = useState(false);
  const projectsQuery = useProjects({
    ...filters,
    query,
    sort
  });
  const projects = useMemo(
    () => projectsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [projectsQuery.data]
  );
  const hasProjects = projects.length > 0;
  const activeFilterCount = getActiveFilterCount(filters);
  const hasSearchOrFilters =
    query.trim().length > 0 || activeFilterCount > 0 || sort !== "created_desc";
  const projectGrid = useMemo(() => getProjectGridMetrics(width), [width]);
  const isMapMode = viewMode === "map";
  const mapScreenBottomPadding =
    width >= atomLayout.breakpointDesktop
      ? atomLayout.marginDesktop
      : width >= atomLayout.breakpointTablet
        ? atomLayout.marginTablet
        : atomLayout.marginMobile;

  const resetProjectView = () => {
    setQuery("");
    setSort("created_desc");
    setFilters(initialProjectFilters);
  };

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = projectsQuery;
  const loadNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const openProject = useCallback(
    (projectId: string) => {
      router.push(`/projects/${projectId}` as never);
    },
    [router]
  );
  const renderProject = useCallback(
    ({ index, item }: ListRenderItemInfo<ProjectSummary>) => (
      <ProjectListItem
        index={index}
        onPress={openProject}
        project={item}
        style={projectGrid.itemStyle}
      />
    ),
    [openProject, projectGrid.itemStyle]
  );

  const updateFilter = <TKey extends keyof ProjectFilterState>(
    key: TKey,
    value: ProjectFilterState[TKey]
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
  };

  const projectsHeader = (
    <View style={styles.listHeader}>
      <NavScreenHeader
        action={
          <View style={{ flexDirection: "row", gap: atomSpacing[2] }}>
            <AppButton
              accessibilityLabel="Project invitations"
              color="neutral"
              fullWidth={false}
              icon={MailIcon}
              layout="icon"
              onPress={() => router.push("/invitations" as never)}
              size="sm"
              variant="bordered"
            />
            {!isCompact ? (
              <AppButton
                fullWidth={false}
                icon={FolderPlusIcon}
                iconAfter={false}
                onPress={() => router.push("/projects/new" as never)}
                size="sm"
              >
                New project
              </AppButton>
            ) : null}
          </View>
        }
        title="Projects"
      />

      <View
        style={[styles.toolbar, isExpanded ? styles.toolbarExpanded : null]}
      >
        <View style={isExpanded ? styles.searchExpanded : styles.searchFluid}>
          <SearchField
            onChangeText={setQuery}
            placeholder="Search projects"
            value={query}
          />
        </View>

        <View style={styles.controlsRow}>
          <SelectMenu
            accessibilityLabel="Sort projects"
            icon={SortIcon}
            labelPrefix="Sort"
            onChange={setSort}
            options={projectSortOptions}
            value={sort}
          />
          <View style={styles.filterControl}>
            <AppButton
              color="neutral"
              fullWidth={false}
              icon={FilterIcon}
              size="sm"
              variant="bordered"
              onPress={() => setFiltersVisible(true)}
            >
              {activeFilterCount > 0
                ? `Filters (${activeFilterCount})`
                : "Filters"}
            </AppButton>
          </View>
        </View>

        <View style={isExpanded ? styles.viewTabsExpanded : undefined}>
          <SegmentedTabs
            onChange={setViewMode}
            options={projectViewOptions}
            selectedTone="accent"
            value={viewMode}
          />
        </View>
      </View>
    </View>
  );

  const emptyContent = projectsQuery.isLoading ? (
    <View style={projectGrid.containerStyle}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={projectGrid.itemStyle}>
          <ProjectCardSkeleton />
        </View>
      ))}
    </View>
  ) : projectsQuery.isError ? (
    <InlineErrorState
      action={{
        icon: RefreshIcon,
        label: "Retry",
        onPress: () => {
          void projectsQuery.refetch();
        }
      }}
      description={getUserFacingErrorMessage(
        projectsQuery.error,
        "We couldn't load your projects. Check your connection and try again."
      )}
      title="Projects unavailable"
    />
  ) : (
    <EmptyState
      action={
        hasSearchOrFilters
          ? {
              icon: RefreshIcon,
              label: "Reset view",
              onPress: resetProjectView
            }
          : {
              icon: FolderPlusIcon,
              label: "New Project",
              onPress: () => router.push("/projects/new" as never)
            }
      }
      description={
        hasSearchOrFilters
          ? "Adjust the search, sort, or filters to widen the project list."
          : "Create your first project to start organizing job-site work."
      }
      icon={hasSearchOrFilters ? FilterIcon : FolderPlusIcon}
      title={hasSearchOrFilters ? "No matching projects" : "No projects yet"}
    />
  );

  const paginationFooter = (
    <ProjectsPaginationFooter
      hasNextPage={Boolean(projectsQuery.hasNextPage)}
      isError={projectsQuery.isFetchNextPageError}
      isLoading={projectsQuery.isFetchingNextPage}
      onLoadMore={loadNextPage}
    />
  );

  return (
    <Screen
      contentContainerStyle={
        isMapMode
          ? [
              styles.mapScreenContainer,
              { paddingBottom: mapScreenBottomPadding }
            ]
          : undefined
      }
      contentStyle={styles.screenContent}
      floatingAction={
        hasProjects && !isMapMode && isCompact ? (
          <AppButton
            accessibilityLabel="New project"
            icon={FolderPlusIcon}
            layout="icon"
            onPress={() => router.push("/projects/new" as never)}
            shape="pill"
            size="iconLg"
          />
        ) : null
      }
      scrollable={false}
    >
      {isMapMode ? (
        <View style={styles.mapScreenStack}>
          {projectsHeader}
          {hasProjects ? (
            <View style={styles.mapBody}>
              <Suspense
                fallback={
                  <View style={projectGrid.containerStyle}>
                    <View style={projectGrid.itemStyle}>
                      <ProjectCardSkeleton />
                    </View>
                  </View>
                }
              >
                <ProjectsMapView
                  fillAvailableSpace
                  onOpenProject={(project) => openProject(project.id)}
                  projects={projects}
                />
              </Suspense>
              {paginationFooter}
            </View>
          ) : (
            emptyContent
          )}
        </View>
      ) : isExpanded ? (
        <View style={styles.expandedList}>
          {projectsHeader}
          {projectsQuery.isLoading ? (
            <ProjectsTableSkeleton />
          ) : projectsQuery.isError || !hasProjects ? (
            emptyContent
          ) : (
            <>
              <ProjectsTable
                onOpenProject={(project) => openProject(project.id)}
                projects={projects}
              />
              {paginationFooter}
            </>
          )}
        </View>
      ) : (
        <FlatList
          columnWrapperStyle={
            projectGrid.columns > 1 ? styles.projectRow : undefined
          }
          contentContainerStyle={styles.projectListContent}
          data={projects}
          initialNumToRender={8}
          ItemSeparatorComponent={ProjectRowSeparator}
          key={`projects-${projectGrid.columns}`}
          keyExtractor={(project) => project.id}
          ListEmptyComponent={emptyContent}
          ListFooterComponent={hasProjects ? paginationFooter : null}
          ListHeaderComponent={projectsHeader}
          maxToRenderPerBatch={8}
          numColumns={projectGrid.columns}
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.5}
          renderItem={renderProject}
          showsVerticalScrollIndicator={false}
          windowSize={7}
        />
      )}
      <ProjectFiltersModal
        filters={filters}
        onChangeFilter={updateFilter}
        onClose={() => setFiltersVisible(false)}
        onReset={() => setFilters(initialProjectFilters)}
        visible={filtersVisible}
      />
    </Screen>
  );
}
