import { AppBadge } from "@/shared/ui/components/badge";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { PROJECT_LABELS_BY_LANGUAGE } from "@/features/projects/constants/project.constants";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import type {
  ProjectSummary,
  ProjectStatus
} from "@/features/projects/types/project.types";
import { getSansFontStyle } from "@/shared/theme/fonts";
import { ChevronRightIcon } from "@/shared/ui/icons";
import { Pressable, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { formatDateOnly } from "@/shared/utils/date-only";

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
  const { t } = useTranslation("features/projects");
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
        <ColumnLabel
          label={t(($) => $["features/projects"].list.project)}
          style={columns.name}
        />
        <ColumnLabel
          label={t(($) => $["features/projects"].list.status)}
          style={columns.status}
        />
        <ColumnLabel
          label={t(($) => $["features/projects"].list.phase)}
          style={columns.phase}
        />
        <ColumnLabel
          label={t(($) => $["features/projects"].list.progress)}
          style={columns.progress}
        />
        <ColumnLabel
          label={t(($) => $["features/projects"].list.dueDate)}
          style={columns.dueDate}
        />
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
  const { formattingLocale, language } = useLocalization();
  const { t } = useTranslation("features/projects");
  const labels = PROJECT_LABELS_BY_LANGUAGE[language];
  const progress = Math.min(Math.max(project.progress_percentage, 0), 100);

  return (
    <Pressable
      accessibilityLabel={t(
        ($) => $["features/projects"].accessibility.openProject,
        { name: project.name }
      )}
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
          {labels.types[project.project_type]} · {project.address}
        </AppText>
      </View>

      <View style={columns.status}>
        <AppBadge tone={getStatusTone(project.status)}>
          {labels.statuses[project.status]}
        </AppBadge>
      </View>

      <View style={columns.phase}>
        <AppText numberOfLines={1} selectable tone="muted" variant="bodySm">
          {labels.phases[project.phase]}
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
          {formatDateOnly(project.estimated_end_date, {
            fallback: "—",
            locale: formattingLocale
          })}
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
