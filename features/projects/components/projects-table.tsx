import { AppBadge } from "@/shared/ui/components/badge";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import {
  PROJECT_PHASE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS
} from "@/features/projects/constants/project.constants";
import type {
  ProjectSummary,
  ProjectStatus
} from "@/features/projects/types/project.types";
import { getSansFontStyle } from "@/shared/theme/fonts";
import { ChevronRightIcon } from "@/shared/ui/icons";
import { Pressable, View, type ViewStyle } from "react-native";

const columns = {
  dueDate: { flex: 0.85, minWidth: 108 },
  name: { flex: 2.2, minWidth: 230 },
  phase: { flex: 1.05, minWidth: 128 },
  progress: { flex: 1.1, minWidth: 140 },
  status: { flex: 0.95, minWidth: 118 }
} as const;

export function ProjectsTable({
  onOpenProject,
  projects
}: {
  onOpenProject: (project: ProjectSummary) => void;
  projects: ProjectSummary[];
}) {
  return (
    <View
      style={{
        backgroundColor: atomPalette.surface,
        borderColor: atomPalette.borderSubtle,
        borderRadius: atomRadii.lg,
        borderWidth: 1,
        overflow: "hidden"
      }}
    >
      <View
        accessibilityRole="header"
        style={{
          alignItems: "center",
          backgroundColor: atomPalette.surfaceLow,
          borderBottomColor: atomPalette.borderSubtle,
          borderBottomWidth: 1,
          flexDirection: "row",
          minHeight: 44,
          paddingHorizontal: atomSpacing[5]
        }}
      >
        <ColumnLabel label="Project" style={columns.name} />
        <ColumnLabel label="Status" style={columns.status} />
        <ColumnLabel label="Phase" style={columns.phase} />
        <ColumnLabel label="Progress" style={columns.progress} />
        <ColumnLabel label="Due date" style={columns.dueDate} />
        <View style={{ width: 24 }} />
      </View>

      {projects.map((project, index) => (
        <ProjectTableRow
          isLast={index === projects.length - 1}
          key={project.id}
          onPress={() => onOpenProject(project)}
          project={project}
        />
      ))}
    </View>
  );
}

export function ProjectsTableSkeleton() {
  return (
    <View
      style={{
        backgroundColor: atomPalette.surface,
        borderColor: atomPalette.borderSubtle,
        borderRadius: atomRadii.lg,
        borderWidth: 1,
        overflow: "hidden"
      }}
    >
      {[0, 1, 2, 3, 4].map((row) => (
        <View
          key={row}
          style={{
            alignItems: "center",
            borderBottomColor: atomPalette.borderSubtle,
            borderBottomWidth: row === 4 ? 0 : 1,
            flexDirection: "row",
            gap: atomSpacing[6],
            minHeight: 78,
            paddingHorizontal: atomSpacing[5]
          }}
        >
          <View style={{ flex: 2.2 }}>
            <SkeletonBlock height={18} width="72%" />
          </View>
          <View style={{ flex: 0.95 }}>
            <SkeletonBlock height={24} width="78%" />
          </View>
          <View style={{ flex: 1.05 }}>
            <SkeletonBlock height={16} width="68%" />
          </View>
          <View style={{ flex: 1.1 }}>
            <SkeletonBlock height={4} width="84%" />
          </View>
          <View style={{ flex: 0.85 }}>
            <SkeletonBlock height={16} width="74%" />
          </View>
        </View>
      ))}
    </View>
  );
}

function ProjectTableRow({
  isLast,
  onPress,
  project
}: {
  isLast: boolean;
  onPress: () => void;
  project: ProjectSummary;
}) {
  const progress = Math.min(Math.max(project.progress_percentage, 0), 100);

  return (
    <Pressable
      accessibilityLabel={`Open ${project.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: pressed
          ? atomPalette.surfaceRaised
          : atomPalette.surface,
        borderBottomColor: atomPalette.borderSubtle,
        borderBottomWidth: isLast ? 0 : 1,
        flexDirection: "row",
        minHeight: 78,
        paddingHorizontal: atomSpacing[5]
      })}
    >
      <View style={[columns.name, { gap: atomSpacing[1] }]}>
        <AppText numberOfLines={1} selectable style={getSansFontStyle("600")}>
          {project.name}
        </AppText>
        <AppText numberOfLines={1} selectable tone="muted" variant="bodySm">
          {PROJECT_TYPE_LABELS[project.project_type]} · {project.address}
        </AppText>
      </View>

      <View style={columns.status}>
        <AppBadge tone={getStatusTone(project.status)}>
          {PROJECT_STATUS_LABELS[project.status]}
        </AppBadge>
      </View>

      <View style={columns.phase}>
        <AppText numberOfLines={1} selectable tone="muted" variant="bodySm">
          {PROJECT_PHASE_LABELS[project.phase]}
        </AppText>
      </View>

      <View style={[columns.progress, { gap: atomSpacing[2] }]}>
        <View
          accessibilityLabel={`Project progress ${progress}%`}
          style={{
            backgroundColor: atomPalette.surfaceStrong,
            height: 4,
            overflow: "hidden",
            width: "82%"
          }}
        >
          <View
            style={{
              backgroundColor: atomPalette.accent,
              height: "100%",
              width: `${progress}%`
            }}
          />
        </View>
        <AppText
          selectable
          style={{ fontVariant: ["tabular-nums"] }}
          tone="accent"
          variant="meta"
        >
          {progress}%
        </AppText>
      </View>

      <View style={columns.dueDate}>
        <AppText selectable tone="muted" variant="bodySm">
          {formatProjectDate(project.estimated_end_date)}
        </AppText>
      </View>

      <ChevronRightIcon color={atomPalette.textSubtle} size="sm" />
    </Pressable>
  );
}

function ColumnLabel({ label, style }: { label: string; style: ViewStyle }) {
  return (
    <View style={style}>
      <AppText tone="subtle" variant="formLabel">
        {label}
      </AppText>
    </View>
  );
}

function getStatusTone(status: ProjectStatus) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "cancelled") {
    return "danger" as const;
  }

  if (status === "in_progress") {
    return "accent" as const;
  }

  return "default" as const;
}

function formatProjectDate(value: string | null) {
  if (!value) {
    return "TBD";
  }

  const [year, month, day] = value.split("-");
  const monthLabel = month ? shortMonthLabels[Number(month) - 1] : undefined;

  return year && monthLabel && day
    ? `${monthLabel} ${Number(day)}, ${year}`
    : value;
}

const shortMonthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
] as const;
