import { projectDetailStyles } from "@/features/projects/components/project-detail/project-detail.styles";
import {
  PROJECT_PHASE_LABELS,
  PROJECT_PHASES,
  PROJECT_STATUS_LABELS
} from "@/features/projects/constants/project.constants";
import type { Project } from "@/features/projects/types/project.types";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { formatDateOnly } from "@/shared/utils/date-only";
import { View } from "react-native";

export function ProjectProgressCard({
  expanded,
  project
}: {
  expanded: boolean;
  project: Project;
}) {
  const progress = Math.min(Math.max(project.progress_percentage, 0), 100);
  const progressWidth = `${progress}%` as `${number}%`;
  const phaseNumber = String(
    PROJECT_PHASES.indexOf(project.phase) + 1
  ).padStart(2, "0");
  const statusLabel = PROJECT_STATUS_LABELS[project.status]
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
          PROJECT_PROGRESS
        </AppText>
      </View>

      <View style={projectDetailStyles.progressCardContent}>
        <AppText tone="subtle" variant="label">
          {`PHASE ${phaseNumber} // ${statusLabel}`}
        </AppText>
        <AppHeading
          selectable
          style={projectDetailStyles.progressPhaseTitle}
          variant="hero"
        >
          {PROJECT_PHASE_LABELS[project.phase]}
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
              ESTIMATED_END
            </AppText>
            <AppText
              numberOfLines={1}
              selectable
              style={projectDetailStyles.progressMetricValue}
            >
              {formatDateOnly(project.estimated_end_date, { fallback: "TBD" })}
            </AppText>
          </View>
        </View>

        <View style={projectDetailStyles.progressMeterBlock}>
          <View
            accessibilityLabel={`Project progress ${progress}%`}
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
              0.00_START
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
              CURRENT_PROGRESS
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
              1.00_FINAL
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}
