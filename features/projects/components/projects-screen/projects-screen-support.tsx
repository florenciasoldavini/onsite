import {
  buildingTypeFilterOptions,
  phaseFilterOptions,
  projectTypeFilterOptions,
  statusFilterOptions,
  type ProjectFilterState
} from "@/features/projects/components/projects-screen/projects-screen.config";
import { projectsScreenStyles as styles } from "@/features/projects/components/projects-screen/projects-screen.styles";
import { ProjectCard } from "@/features/projects/components/project-card";
import type { ProjectSummary } from "@/features/projects/types/project.types";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { MultiSelectField } from "@/shared/ui/components/multi-select-field";
import { AppText } from "@/shared/ui/components/text";
import { TransitionView } from "@/shared/ui/components/transition-view";
import { memo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle
} from "react-native";

export const ProjectListItem = memo(function ProjectListItem({
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
    <TransitionView
      animateEnter
      animateExit
      animateLayout
      animationDelay={Math.min(index, 6) * 36}
      style={style}
    >
      <ProjectCard onPress={() => onPress(project.id)} project={project} />
    </TransitionView>
  );
});

export function ProjectsPaginationFooter({
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

export function ProjectRowSeparator() {
  return <View style={styles.projectRowSeparator} />;
}

export function ProjectFiltersModal({
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
        <TransitionView animateEnter style={styles.modalContent}>
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
        </TransitionView>
      </View>
    </Modal>
  );
}
