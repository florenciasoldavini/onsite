import type { ProjectFilterState } from "@/features/projects/components/projects-screen/projects-screen.config";
import {
  PROJECT_BUILDING_TYPES,
  PROJECT_LABELS_BY_LANGUAGE,
  PROJECT_PHASES,
  PROJECT_STATUSES,
  PROJECT_TYPES
} from "@/features/projects/constants/project.constants";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import { projectsScreenStyles as styles } from "@/features/projects/components/projects-screen/projects-screen.styles";
import { ProjectCard } from "@/features/projects/components/project-card";
import type { ProjectSummary } from "@/features/projects/types/project.types";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { MultiSelectField } from "@/shared/ui/components/multi-select-field";
import { AppText } from "@/shared/ui/components/text";
import { TransitionView } from "@/shared/ui/components/transition-view";
import { memo } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("features/projects");
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
        {isError
          ? t(($) => $["features/projects"].actions.retryLoad)
          : t(($) => $["features/projects"].actions.loadMore)}
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
  const { language } = useLocalization();
  const { t } = useTranslation("features/projects");
  const labels = PROJECT_LABELS_BY_LANGUAGE[language];
  const statusFilterOptions = PROJECT_STATUSES.map((value) => ({
    label: labels.statuses[value],
    value
  }));
  const phaseFilterOptions = PROJECT_PHASES.map((value) => ({
    label: labels.phases[value],
    value
  }));
  const projectTypeFilterOptions = PROJECT_TYPES.map((value) => ({
    label: labels.types[value],
    value
  }));
  const buildingTypeFilterOptions = PROJECT_BUILDING_TYPES.map((value) => ({
    label: labels.buildingTypes[value],
    value
  }));
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel={t(
            ($) => $["features/projects"].accessibility.closeFilters
          )}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.modalBackdrop} />
        <TransitionView animateEnter style={styles.modalContent}>
          <AppCard padding="md" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppText variant="formLabel">
                {t(($) => $["features/projects"].filters.title)}
              </AppText>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <MultiSelectField
                label={t(($) => $["features/projects"].filters.status)}
                onChange={(value) => onChangeFilter("statuses", value)}
                options={statusFilterOptions}
                value={filters.statuses}
              />
              <MultiSelectField
                label={t(($) => $["features/projects"].filters.phase)}
                onChange={(value) => onChangeFilter("phases", value)}
                options={phaseFilterOptions}
                value={filters.phases}
              />
              <MultiSelectField
                label={t(($) => $["features/projects"].filters.projectType)}
                onChange={(value) => onChangeFilter("projectTypes", value)}
                options={projectTypeFilterOptions}
                value={filters.projectTypes}
              />
              <MultiSelectField
                label={t(($) => $["features/projects"].filters.buildingType)}
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
                  {t(($) => $["features/projects"].actions.clear)}
                </AppButton>
              </View>
              <View style={styles.modalFooterAction}>
                <AppButton onPress={onClose} size="md">
                  {t(($) => $["features/projects"].actions.done)}
                </AppButton>
              </View>
            </View>
          </AppCard>
        </TransitionView>
      </View>
    </Modal>
  );
}
