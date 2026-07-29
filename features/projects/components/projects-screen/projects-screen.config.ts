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
import type {
  ProjectBuildingType,
  ProjectFilters,
  ProjectPhase,
  ProjectSort,
  ProjectStatus,
  ProjectType
} from "@/features/projects/types/project.types";
import { atomLayout, atomSpacing } from "@/shared/ui/components/theme";
import type { ViewStyle } from "react-native";

export type ProjectFilterState = Required<
  Pick<ProjectFilters, "buildingTypes" | "phases" | "projectTypes" | "statuses">
>;
export type ProjectsViewMode = "list" | "map";

export const initialProjectFilters: ProjectFilterState = {
  buildingTypes: [],
  phases: [],
  projectTypes: [],
  statuses: []
};

export const projectSortOptions = [
  { label: "Newest", value: "created_desc" },
  { label: "Oldest", value: "created_asc" },
  { label: "A-Z", value: "name_asc" },
  { label: "Z-A", value: "name_desc" }
] satisfies { label: string; value: ProjectSort }[];

export const projectViewOptions = [
  { label: "List", value: "list" },
  { label: "Map", value: "map" }
] satisfies { label: string; value: ProjectsViewMode }[];

export const statusFilterOptions = createFilterOptions<ProjectStatus>(
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS
);
export const phaseFilterOptions = createFilterOptions<ProjectPhase>(
  PROJECT_PHASES,
  PROJECT_PHASE_LABELS
);
export const projectTypeFilterOptions = createFilterOptions<ProjectType>(
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS
);
export const buildingTypeFilterOptions =
  createFilterOptions<ProjectBuildingType>(
    PROJECT_BUILDING_TYPES,
    PROJECT_BUILDING_TYPE_LABELS
  );

export function getProjectGridMetrics(screenWidth: number) {
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

export function getActiveFilterCount(filters: ProjectFilterState) {
  return Object.values(filters).reduce(
    (total, selectedValues) => total + selectedValues.length,
    0
  );
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
