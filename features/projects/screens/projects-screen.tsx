import {
  AppButton,
  AppCard,
  AppText,
  EmptyState,
  MultiSelectField,
  NavScreenHeader,
  Screen,
  SegmentedTabs,
  SelectMenu,
  TextField
} from "@/shared/ui/components";
import { atomMotion } from "@/shared/ui/components/motion";
import { atomLayout, atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectCardSkeleton } from "@/features/projects/components/project-card-skeleton";
import {
  ProjectsTable,
  ProjectsTableSkeleton
} from "@/features/projects/components/projects-table";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import {
  PROJECT_BUILDING_TYPES,
  PROJECT_BUILDING_TYPE_LABELS,
  PROJECT_PHASES,
  PROJECT_PHASE_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS
} from "@/features/projects/constants/project.constants";
import { useProjects } from "@/features/projects/hooks/use-projects";
import type {
  ProjectBuildingType,
  ProjectFilters,
  ProjectPhase,
  ProjectSort,
  ProjectStatus,
  ProjectSummary,
  ProjectType
} from "@/features/projects/types/project.types";
import {
  FilterIcon,
  FolderPlusIcon,
  RefreshIcon,
  SearchIcon,
  SortIcon
} from "@/shared/ui/icons";
import { useRouter } from "expo-router";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { Suspense, lazy, memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
  type ViewStyle
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition
} from "react-native-reanimated";

const ProjectsMapView = lazy(async () => {
  const module = await import(
    "@/features/projects/components/projects-map-view"
  );

  return { default: module.ProjectsMapView };
});

type ProjectFilterState = Required<
  Pick<ProjectFilters, "buildingTypes" | "phases" | "projectTypes" | "statuses">
>;
type ProjectsViewMode = "list" | "map";

const initialProjectFilters: ProjectFilterState = {
  buildingTypes: [],
  phases: [],
  projectTypes: [],
  statuses: []
};

const projectSortOptions = [
  { label: "Newest", value: "created_desc" },
  { label: "Oldest", value: "created_asc" },
  { label: "A-Z", value: "name_asc" },
  { label: "Z-A", value: "name_desc" }
] satisfies { label: string; value: ProjectSort }[];
const projectViewOptions = [
  { label: "List", value: "list" },
  { label: "Map", value: "map" }
] satisfies { label: string; value: ProjectsViewMode }[];

const statusFilterOptions = createFilterOptions<ProjectStatus>(
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS
);
const phaseFilterOptions = createFilterOptions<ProjectPhase>(
  PROJECT_PHASES,
  PROJECT_PHASE_LABELS
);
const projectTypeFilterOptions = createFilterOptions<ProjectType>(
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS
);
const buildingTypeFilterOptions = createFilterOptions<ProjectBuildingType>(
  PROJECT_BUILDING_TYPES,
  PROJECT_BUILDING_TYPE_LABELS
);

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
          !isCompact ? (
            <AppButton
              fullWidth={false}
              icon={FolderPlusIcon}
              iconAfter={false}
              onPress={() => router.push("/projects/new" as never)}
              size="sm"
            >
              New project
            </AppButton>
          ) : null
        }
        title="Projects"
      />

      <View style={[styles.toolbar, isExpanded ? styles.toolbarExpanded : null]}>
        <View style={isExpanded ? styles.searchExpanded : styles.searchFluid}>
          <TextField
            leftIcon={SearchIcon}
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
    <EmptyState
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

const ProjectListItem = memo(function ProjectListItem({
  index,
  onPress,
  project,
  style
}: {
  index: number;
  onPress: (projectId: string) => void;
  project: ProjectSummary;
  style: ViewStyle;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(atomMotion.duration.enter).delay(
        Math.min(index, 6) * 36
      )}
      exiting={FadeOut.duration(atomMotion.duration.exit)}
      layout={LinearTransition.duration(atomMotion.duration.layout)}
      style={style}
    >
      <ProjectCard onPress={() => onPress(project.id)} project={project} />
    </Animated.View>
  );
});

function ProjectsPaginationFooter({
  hasNextPage,
  isError,
  isLoading,
  onLoadMore
}: {
  hasNextPage: boolean;
  isError: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}) {
  if (!hasNextPage && !isError) {
    return null;
  }

  return (
    <View style={styles.paginationFooter}>
      <AppButton
        color="neutral"
        loading={isLoading}
        onPress={onLoadMore}
        size="sm"
        variant="bordered"
      >
        {isError ? "Retry loading projects" : "Load more projects"}
      </AppButton>
    </View>
  );
}

function ProjectRowSeparator() {
  return <View style={styles.projectRowSeparator} />;
}

function ProjectFiltersModal({
  filters,
  onChangeFilter,
  onClose,
  onReset,
  visible
}: {
  filters: ProjectFilterState;
  onChangeFilter: <TKey extends keyof ProjectFilterState>(
    key: TKey,
    value: ProjectFilterState[TKey]
  ) => void;
  onClose: () => void;
  onReset: () => void;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Close project filters"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.modalBackdrop} />
        <Animated.View
          entering={FadeIn.duration(atomMotion.duration.enter)}
          style={styles.modalContent}
        >
          <AppCard padding="md" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppText variant="formLabel">Project filters</AppText>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <MultiSelectField
                label="Status"
                onChange={(value) => onChangeFilter("statuses", value)}
                options={statusFilterOptions}
                value={filters.statuses}
              />
              <MultiSelectField
                label="Phase"
                onChange={(value) => onChangeFilter("phases", value)}
                options={phaseFilterOptions}
                value={filters.phases}
              />
              <MultiSelectField
                label="Project type"
                onChange={(value) => onChangeFilter("projectTypes", value)}
                options={projectTypeFilterOptions}
                value={filters.projectTypes}
              />
              <MultiSelectField
                label="Building type"
                onChange={(value) => onChangeFilter("buildingTypes", value)}
                options={buildingTypeFilterOptions}
                value={filters.buildingTypes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.modalFooterAction}>
                <AppButton
                  color="neutral"
                  onPress={onReset}
                  size="md"
                  variant="bordered"
                >
                  Clear
                </AppButton>
              </View>
              <View style={styles.modalFooterAction}>
                <AppButton onPress={onClose} size="md">
                  Done
                </AppButton>
              </View>
            </View>
          </AppCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

function getProjectGridMetrics(screenWidth: number) {
  const horizontalPadding =
    screenWidth >= atomLayout.breakpointDesktop
      ? atomLayout.marginDesktop
      : screenWidth >= atomLayout.breakpointTablet
        ? atomLayout.marginTablet
        : atomLayout.marginMobile;
  const availableWidth = Math.max(
    0,
    Math.min(screenWidth, atomLayout.maxWidthContent) - horizontalPadding * 2
  );
  const gap = atomSpacing[4];
  const columns =
    availableWidth >= 1080
      ? 4
      : availableWidth >= 900
        ? 3
        : availableWidth >= atomLayout.breakpointTablet
          ? 2
          : 1;
  const itemWidth =
    columns === 1
      ? ("100%" as const)
      : (availableWidth - gap * (columns - 1)) / columns;

  return {
    columns,
    containerStyle: {
      alignItems: "stretch" as const,
      flexDirection: columns === 1 ? ("column" as const) : ("row" as const),
      flexWrap: "wrap" as const,
      gap
    } satisfies ViewStyle,
    itemStyle: {
      flexGrow: 0,
      flexShrink: 0,
      width: itemWidth
    } satisfies ViewStyle
  };
}

function createFilterOptions<TValue extends string>(
  values: readonly TValue[],
  labels: Record<TValue, string>
) {
  return values.map((value) => ({
    label: labels[value],
    value
  }));
}

function getActiveFilterCount(filters: ProjectFilterState) {
  return Object.values(filters).reduce(
    (total, selectedValues) => total + selectedValues.length,
    0
  );
}

const styles = StyleSheet.create({
  controlsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: atomSpacing[2]
  },
  filterControl: {
    flexShrink: 0
  },
  listHeader: {
    gap: atomSpacing[6],
    marginBottom: atomSpacing[6]
  },
  mapBody: {
    flex: 1,
    gap: atomSpacing[4],
    minHeight: 0
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 22, 28, 0.18)"
  },
  modalBody: {
    gap: atomSpacing[5],
    paddingBottom: atomSpacing[1]
  },
  modalCard: {
    borderColor: atomPalette.borderSubtle,
    maxHeight: "86%",
    width: "100%"
  },
  modalContent: {
    maxWidth: 560,
    width: "100%"
  },
  modalFooter: {
    flexDirection: "row",
    gap: atomSpacing[3],
    paddingTop: atomSpacing[5]
  },
  modalFooterAction: {
    flex: 1
  },
  modalHeader: {
    borderBottomColor: atomPalette.borderSubtle,
    borderBottomWidth: 1,
    marginBottom: atomSpacing[5],
    paddingBottom: atomSpacing[4]
  },
  modalRoot: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: atomSpacing[4]
  },
  mapScreenContainer: {
    paddingBottom: atomSpacing[5]
  },
  mapScreenStack: {
    flex: 1,
    minHeight: 0
  },
  expandedList: {
    flex: 1,
    gap: atomSpacing[4],
    minHeight: 0
  },
  paginationFooter: {
    alignItems: "center",
    paddingVertical: atomSpacing[5]
  },
  projectListContent: {
    flexGrow: 1,
    paddingBottom: atomSpacing[6]
  },
  projectRow: {
    gap: atomSpacing[4]
  },
  projectRowSeparator: {
    height: atomSpacing[4]
  },
  screenContent: {
    flex: 1,
    minWidth: 0
  },
  searchExpanded: {
    flex: 1,
    maxWidth: 420,
    minWidth: 280
  },
  searchFluid: {
    width: "100%"
  },
  toolbar: {
    gap: atomSpacing[3]
  },
  toolbarExpanded: {
    alignItems: "center",
    flexDirection: "row"
  },
  viewTabsExpanded: {
    marginLeft: "auto",
    width: 220
  }
});
