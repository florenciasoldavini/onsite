import { projectDetailStyles } from "@/features/projects/components/project-detail/project-detail.styles";
import {
  PROJECT_LABELS_BY_LANGUAGE,
  PROJECT_PHASES
} from "@/features/projects/constants/project.constants";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import type { Project } from "@/features/projects/types/project.types";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { formatDateOnly } from "@/shared/utils/date-only";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

export function ProjectProgressCard({
  expanded,
  project
}: {
  expanded: boolean;
  project: Project;
}) {
  const { formattingLocale, language } = useLocalization();
  const { t } = useTranslation("features/projects");
  const labels = PROJECT_LABELS_BY_LANGUAGE[language];
  const progress = Math.min(Math.max(project.progress_percentage, 0), 100);
  const progressWidth = `${progress}%` as `${number}%`;
  const phaseNumber = String(
    PROJECT_PHASES.indexOf(project.phase) + 1
  ).padStart(2, "0");
  const statusLabel = labels.statuses[project.status]
    .toUpperCase()
    .replaceAll(" ", "_");

  return (
    <View
      style={[
        projectDetailStyles.progressCard,
        expanded ? projectDetailStyles.progressCardExpanded : null
      ]}
    >
      <View style={projectDetailStyles.progressDataBadge}>
        <View style={projectDetailStyles.progressDataDot} />
        <AppText tone="accent" variant="label">
          {t(($) => $["features/projects"].detail.progressEyebrow)}
        </AppText>
      </View>

      <View style={projectDetailStyles.progressCardContent}>
        <AppText tone="subtle" variant="label">
          {t(($) => $["features/projects"].detail.phaseStatus, {
            phase: phaseNumber,
            status: statusLabel
          })}
        </AppText>
        <AppHeading
          selectable
          style={projectDetailStyles.progressPhaseTitle}
          variant="hero"
        >
          {labels.phases[project.phase]}
        </AppHeading>

        <View style={projectDetailStyles.progressValuesRow}>
          <View style={projectDetailStyles.progressNumberRow}>
            <AppHeading
              selectable
              style={projectDetailStyles.progressNumber}
              variant="hero"
            >
              {progress}
            </AppHeading>
            <AppText style={projectDetailStyles.progressPercent} tone="accent">
              %
            </AppText>
          </View>

          <View style={projectDetailStyles.progressMetric}>
            <AppText tone="subtle" variant="label">
              {t(($) => $["features/projects"].detail.estimatedEnd)}
            </AppText>
            <AppText
              numberOfLines={1}
              selectable
              style={projectDetailStyles.progressMetricValue}
            >
              {formatDateOnly(project.estimated_end_date, {
                fallback: "—",
                locale: formattingLocale
              })}
            </AppText>
          </View>
        </View>

        <View style={projectDetailStyles.progressMeterBlock}>
          <View
            accessibilityLabel={t(
              ($) => $["features/projects"].accessibility.progress,
              { progress }
            )}
            style={projectDetailStyles.progressTrack}
          >
            <View
              style={[
                projectDetailStyles.progressFill,
                { width: progressWidth }
              ]}
            />
          </View>
          <View style={projectDetailStyles.progressMeterLabels}>
            <AppText
              numberOfLines={1}
              style={projectDetailStyles.progressMeterLabel}
              tone="subtle"
              variant="meta"
            >
              {t(($) => $["features/projects"].detail.start)}
            </AppText>
            <AppText
              numberOfLines={1}
              style={[
                projectDetailStyles.progressMeterLabel,
                projectDetailStyles.progressMeterLabelCenter
              ]}
              tone="subtle"
              variant="meta"
            >
              {t(($) => $["features/projects"].detail.actualProgress)}
            </AppText>
            <AppText
              numberOfLines={1}
              style={[
                projectDetailStyles.progressMeterLabel,
                projectDetailStyles.progressMeterLabelRight
              ]}
              tone="subtle"
              variant="meta"
            >
              {t(($) => $["features/projects"].detail.final)}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}
