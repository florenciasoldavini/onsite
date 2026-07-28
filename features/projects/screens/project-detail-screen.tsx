import { AppButton } from "@/shared/ui/components/button";
import { useClient } from "@/features/clients/hooks/use-clients";
import { getClientDisplayName } from "@/features/clients/schemas/client.schema";
import { AppCard } from "@/shared/ui/components/card";
import {
  DestructiveConfirmationDialog,
  useDestructiveConfirmation
} from "@/shared/ui/components/destructive-confirmation-dialog";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { AppHeading } from "@/shared/ui/components/heading";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { useAppToast } from "@/shared/ui/components/toast";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import {
  PROJECT_PHASE_LABELS,
  PROJECT_PHASES,
  PROJECT_STATUS_LABELS
} from "@/features/projects/constants/project.constants";
import {
  useProject,
  useSoftDeleteProject
} from "@/features/projects/hooks/use-projects";
import type { Project } from "@/features/projects/types/project.types";
import {
  AlertIcon,
  CameraIcon,
  CirclePlusIcon,
  FolderOpenIcon,
  ListChecksIcon,
  MoreVerticalIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  RefreshIcon,
  TrashIcon
} from "@/shared/ui/icons";
import { formatDateOnly } from "@/shared/utils/date-only";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutRectangle,
  type ViewStyle
} from "react-native";

const projectActions = [
  {
    accent: false,
    icon: FolderOpenIcon,
    index: "01",
    label: "DOCUMENTATION",
    target: null
  },
  {
    accent: false,
    icon: CameraIcon,
    index: "02",
    label: "PHOTOS",
    target: "photos"
  },
  {
    accent: false,
    icon: AlertIcon,
    index: "03",
    label: "INCIDENT_LOG",
    target: null
  },
  {
    accent: false,
    icon: ListChecksIcon,
    index: "04",
    label: "TO_DO_LIST",
    target: null
  },
  {
    accent: true,
    icon: CirclePlusIcon,
    index: "05",
    label: "DAILY_REPORT",
    target: null
  }
] as const;

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { isExpanded } = useLayoutMode();
  const params = useLocalSearchParams<{ projectId: string }>();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const projectQuery = useProject(projectId);
  const clientQuery = useClient(projectQuery.data?.client_id ?? undefined);

  if (projectQuery.isError) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => {
              void projectQuery.refetch();
            }
          }}
          description={getUserFacingErrorMessage(
            projectQuery.error,
            "We couldn't load this project. Check your connection and try again."
          )}
          icon={AlertIcon}
          title="Project unavailable"
        />
      </Screen>
    );
  }

  if (!projectQuery.isLoading && !projectQuery.data) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            label: "Back to projects",
            onPress: () => router.replace("/projects" as never)
          }}
          description="This project may have been removed or you may not have access."
          icon={AlertIcon}
          title="Project not found"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.pageStack}>
        <Breadcrumb
          items={[
            {
              accessibilityLabel: "Back to projects",
              label: "Projects",
              onPress: () => router.replace("/projects" as never)
            },
            { label: "Project Detail" }
          ]}
        />

        <ProjectScreenTitle
          isLoading={projectQuery.isLoading}
          project={projectQuery.data}
          projectId={projectId}
        />

        {projectQuery.data?.client_id ? (
          <ProjectClientCard clientQuery={clientQuery} />
        ) : null}

        <View
          style={[
            styles.detailWorkspace,
            isExpanded ? styles.detailWorkspaceExpanded : null
          ]}
        >
          <ProjectProgressCard
            expanded={isExpanded}
            isLoading={projectQuery.isLoading}
            project={projectQuery.data}
          />

          <View
            style={[
              styles.actionGrid,
              isExpanded ? styles.actionGridExpanded : null
            ]}
          >
            {projectActions.map((action) => (
              <ProjectActionCard
                expanded={isExpanded}
                key={action.index}
                onPress={
                  action.target === "photos"
                    ? () =>
                        router.push(
                          `/projects/${projectId}/photos` as never
                        )
                    : undefined
                }
                {...action}
              />
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}

function ProjectClientCard({
  clientQuery
}: {
  clientQuery: ReturnType<typeof useClient>;
}) {
  const router = useRouter();

  if (clientQuery.isLoading) {
    return <SkeletonBlock height={126} />;
  }

  if (clientQuery.isError) {
    return (
      <AppCard padding="md" tone="muted">
        <View style={{ gap: atomSpacing[3] }}>
          <AppHeading variant="card">Client unavailable</AppHeading>
          <AppText tone="muted">
            We couldn&apos;t load this client&apos;s contact details.
          </AppText>
          <AppButton
            color="neutral"
            fullWidth={false}
            onPress={() => void clientQuery.refetch()}
            size="sm"
            variant="bordered"
          >
            Retry
          </AppButton>
        </View>
      </AppCard>
    );
  }

  if (!clientQuery.data) {
    return null;
  }

  const client = clientQuery.data;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/clients/${client.id}` as never)}
    >
      <AppCard padding="md">
        <View style={{ gap: atomSpacing[3] }}>
          <AppText tone="accent" variant="eyebrow">
            CLIENT
          </AppText>
          <AppHeading variant="card">
            {getClientDisplayName(client)}
          </AppHeading>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: atomSpacing[4]
            }}
          >
            <ProjectClientContact
              icon={PhoneIcon}
              value={client.phone_number ?? "No phone number"}
            />
            <ProjectClientContact
              icon={MailIcon}
              value={client.email ?? "No email address"}
            />
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

function ProjectClientContact({
  icon: Icon,
  value
}: {
  icon: typeof PhoneIcon;
  value: string;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        flexDirection: "row",
        gap: atomSpacing[2]
      }}
    >
      <Icon color={atomPalette.textMuted} size="sm" />
      <AppText tone="muted" variant="bodySm">
        {value}
      </AppText>
    </View>
  );
}

function ProjectScreenTitle({
  isLoading,
  project,
  projectId
}: {
  isLoading: boolean;
  project: Project | null | undefined;
  projectId?: string;
}) {
  if (isLoading) {
    return (
      <View style={styles.titleRow}>
        <View style={styles.titleContent}>
          <SkeletonBlock height={48} width="72%" />
        </View>
      </View>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <View style={styles.titleRow}>
      <AppHeading selectable style={styles.titleContent} variant="hero">
        {project.name}
      </AppHeading>
      <ProjectActionsMenu
        projectId={projectId ?? project.id}
        projectName={project.name}
      />
    </View>
  );
}

function ProjectActionsMenu({
  projectId,
  projectName
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const appToast = useAppToast();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const triggerRef = useRef<View>(null);
  const deleteMutation = useSoftDeleteProject();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const deleteConfirmation = useDestructiveConfirmation();
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(
    null
  );
  const menuWidth = 184;
  const menuHeight = 100;
  const menuLeft = clamp(
    (triggerLayout?.x ?? windowWidth - menuWidth - atomSpacing[4]) +
      (triggerLayout?.width ?? 0) -
      menuWidth,
    atomSpacing[4],
    windowWidth - menuWidth - atomSpacing[4]
  );
  const preferredMenuTop =
    (triggerLayout?.y ?? 0) + (triggerLayout?.height ?? 0) + atomSpacing[2];
  const menuTop =
    preferredMenuTop + menuHeight > windowHeight - atomSpacing[4] &&
    triggerLayout
      ? triggerLayout.y - menuHeight - atomSpacing[2]
      : preferredMenuTop;

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ height, width, x, y });
      setIsMenuOpen(true);
    });
  };

  const deleteProject = async () => {
    deleteConfirmation.clearError();

    try {
      await deleteMutation.mutateAsync(projectId);
      deleteConfirmation.close();
      appToast.show({
        description: `${projectName} was removed from active projects.`,
        title: "Project deleted",
        tone: "success"
      });
      router.replace("/projects" as never);
    } catch (error) {
      const message = getUserFacingErrorMessage(
        error,
        "We couldn't delete this project. Try again."
      );

      deleteConfirmation.setError(message);
      appToast.show({
        description: message,
        title: "Project could not be deleted",
        tone: "error"
      });
    }
  };

  return (
    <>
      <View collapsable={false} ref={triggerRef}>
        <AppButton
          accessibilityLabel="Project actions"
          color="neutral"
          fullWidth={false}
          icon={MoreVerticalIcon}
          layout="icon"
          onPress={openMenu}
          shape="pill"
          size="sm"
          variant="bordered"
        />
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
        transparent
        visible={isMenuOpen}
      >
        <View style={StyleSheet.absoluteFill}>
          <Pressable
            accessibilityLabel="Close project actions"
            onPress={() => setIsMenuOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.actionsMenu,
              { left: menuLeft, top: menuTop, width: menuWidth }
            ]}
          >
            <ActionMenuItem
              icon={PencilIcon}
              label="Edit"
              onPress={() => {
                setIsMenuOpen(false);
                router.push(`/projects/${projectId}/edit` as never);
              }}
            />
            <ActionMenuItem
              danger
              icon={TrashIcon}
              label="Delete"
              onPress={() => {
                setIsMenuOpen(false);
                deleteConfirmation.open();
              }}
            />
          </View>
        </View>
      </Modal>

      <DestructiveConfirmationDialog
        accessibilityLabel="Cancel deleting project"
        controller={deleteConfirmation}
        description={`${projectName} will be removed from active project views. This action cannot currently be undone in the app.`}
        isPending={deleteMutation.isPending}
        onConfirm={deleteProject}
        title="Delete project?"
      />
    </>
  );
}

function ActionMenuItem({
  danger = false,
  icon: Icon,
  label,
  onPress
}: {
  danger?: boolean;
  icon: typeof PencilIcon;
  label: string;
  onPress: () => void;
}) {
  const color = danger ? atomPalette.errorText : atomPalette.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionsMenuItem,
        pressed ? styles.actionsMenuItemPressed : null,
        process.env.EXPO_OS === "web" ? styles.webCursor : null
      ]}
    >
      <Icon color={color} size={17} />
      <AppText tone={danger ? "danger" : "default"} variant="bodySm">
        {label}
      </AppText>
    </Pressable>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function ProjectProgressCard({
  expanded,
  isLoading,
  project
}: {
  expanded: boolean;
  isLoading: boolean;
  project: Project | null | undefined;
}) {
  if (isLoading) {
    return (
      <View
        style={[
          styles.progressCard,
          expanded ? styles.progressCardExpanded : null,
          styles.progressCardLoading
        ]}
      >
        <SkeletonBlock height={18} width="44%" />
        <SkeletonBlock height={56} width="66%" />
        <SkeletonBlock height={118} width="52%" />
        <SkeletonBlock height={6} />
      </View>
    );
  }

  if (!project) {
    return (
      <View
        style={[
          styles.progressCard,
          expanded ? styles.progressCardExpanded : null,
          styles.progressCardUnavailable
        ]}
      >
        <AppText tone="subtle" variant="meta">
          PROJECT_PROGRESS_UNAVAILABLE
        </AppText>
      </View>
    );
  }

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
        styles.progressCard,
        expanded ? styles.progressCardExpanded : null
      ]}
    >
      <View style={styles.progressDataBadge}>
        <View style={styles.progressDataDot} />
        <AppText tone="accent" variant="label">
          PROJECT_PROGRESS
        </AppText>
      </View>

      <View style={styles.progressCardContent}>
        <AppText tone="subtle" variant="label">
          {`PHASE ${phaseNumber} // ${statusLabel}`}
        </AppText>
        <AppHeading selectable style={styles.progressPhaseTitle} variant="hero">
          {PROJECT_PHASE_LABELS[project.phase]}
        </AppHeading>

        <View style={styles.progressValuesRow}>
          <View style={styles.progressNumberRow}>
            <AppHeading selectable style={styles.progressNumber} variant="hero">
              {progress}
            </AppHeading>
            <AppText style={styles.progressPercent} tone="accent">
              %
            </AppText>
          </View>

          <View style={styles.progressMetric}>
            <AppText tone="subtle" variant="label">
              ESTIMATED_END
            </AppText>
            <AppText
              numberOfLines={1}
              selectable
              style={styles.progressMetricValue}
            >
              {formatDateOnly(project.estimated_end_date, { fallback: "TBD" })}
            </AppText>
          </View>
        </View>

        <View style={styles.progressMeterBlock}>
          <View
            accessibilityLabel={`Project progress ${progress}%`}
            style={styles.progressTrack}
          >
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <View style={styles.progressMeterLabels}>
            <AppText
              numberOfLines={1}
              style={styles.progressMeterLabel}
              tone="subtle"
              variant="meta"
            >
              0.00_START
            </AppText>
            <AppText
              numberOfLines={1}
              style={[
                styles.progressMeterLabel,
                styles.progressMeterLabelCenter
              ]}
              tone="subtle"
              variant="meta"
            >
              CURRENT_PROGRESS
            </AppText>
            <AppText
              numberOfLines={1}
              style={[
                styles.progressMeterLabel,
                styles.progressMeterLabelRight
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

function ProjectActionCard({
  accent,
  expanded,
  icon: Icon,
  index,
  label,
  onPress
}: (typeof projectActions)[number] & {
  expanded: boolean;
  onPress?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const iconColor = accent ? atomPalette.accentText : atomPalette.textMuted;
  const textTone = accent ? "inverse" : "default";

  return (
    <Pressable
      accessibilityHint={
        onPress
          ? "Opens this project feature."
          : "This action will be available in a future update."
      }
      accessibilityLabel={label.replaceAll("_", " ").toLowerCase()}
      accessibilityRole="button"
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        expanded ? styles.actionCardExpanded : null,
        accent ? styles.actionCardAccent : styles.actionCardDefault,
        isHovered && !accent ? styles.actionCardHovered : null,
        pressed ? styles.actionCardPressed : null,
        process.env.EXPO_OS === "web" ? styles.webCursor : null
      ]}
    >
      <Icon color={iconColor} size={30} strokeWidth={2} />

      <View style={styles.actionLabel}>
        <AppText style={styles.actionLabelText} tone={textTone} variant="label">
          {index}_
        </AppText>
        <AppText
          numberOfLines={2}
          style={styles.actionLabelText}
          tone={textTone}
          variant="label"
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    aspectRatio: 1,
    borderRadius: atomRadii.xl,
    borderWidth: 1,
    flexBasis: "45%",
    flexGrow: 1,
    justifyContent: "space-between",
    maxWidth: 360,
    minWidth: 0,
    padding: atomSpacing[6]
  },
  actionCardAccent: {
    backgroundColor: atomPalette.accent,
    borderColor: atomPalette.accent
  },
  actionCardDefault: {
    backgroundColor: atomPalette.surface,
    borderColor: atomPalette.border
  },
  actionCardHovered: {
    borderColor: atomPalette.borderStrong
  },
  actionCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }]
  },
  actionGrid: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: atomSpacing[5],
    maxWidth: 744,
    width: "100%"
  },
  actionCardExpanded: {
    maxWidth: undefined,
    padding: atomSpacing[5]
  },
  actionGridExpanded: {
    alignSelf: "stretch",
    flex: 0.72,
    maxWidth: 420
  },
  actionLabel: {
    alignItems: "flex-start"
  },
  actionLabelText: {
    letterSpacing: 1.4,
    textAlign: "left"
  },
  actionsMenu: {
    backgroundColor: atomPalette.surface,
    borderColor: atomPalette.border,
    borderRadius: atomRadii.md,
    borderWidth: 1,
    boxShadow: "0 10px 28px rgba(18, 18, 18, 0.14)",
    gap: atomSpacing[1],
    padding: atomSpacing[1],
    position: "absolute"
  },
  actionsMenuItem: {
    alignItems: "center",
    borderRadius: atomRadii.sm,
    flexDirection: "row",
    gap: atomSpacing[3],
    minHeight: 42,
    paddingHorizontal: atomSpacing[3],
    paddingVertical: atomSpacing[2]
  },
  actionsMenuItemPressed: {
    backgroundColor: atomPalette.surfaceLow
  },
  pageStack: {
    gap: atomSpacing[6]
  },
  detailWorkspace: {
    gap: atomSpacing[5]
  },
  detailWorkspaceExpanded: {
    alignItems: "stretch",
    flexDirection: "row"
  },
  progressCard: {
    alignSelf: "center",
    backgroundColor: atomPalette.surface,
    borderColor: atomPalette.border,
    borderRadius: atomRadii.xl,
    borderWidth: 1,
    maxWidth: 744,
    minHeight: 440,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  progressCardContent: {
    flex: 1,
    padding: atomSpacing[6],
    paddingTop: atomSpacing[16]
  },
  progressCardExpanded: {
    alignSelf: "stretch",
    flex: 1,
    maxWidth: undefined
  },
  progressCardLoading: {
    gap: atomSpacing[6],
    justifyContent: "center",
    padding: atomSpacing[6]
  },
  progressCardUnavailable: {
    alignItems: "center",
    justifyContent: "center"
  },
  progressDataBadge: {
    alignItems: "center",
    borderBottomColor: atomPalette.border,
    borderBottomLeftRadius: atomRadii.lg,
    borderBottomWidth: 1,
    borderLeftColor: atomPalette.border,
    borderLeftWidth: 1,
    flexDirection: "row",
    gap: atomSpacing[3],
    paddingHorizontal: atomSpacing[5],
    paddingVertical: atomSpacing[4],
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1
  },
  progressDataDot: {
    backgroundColor: atomPalette.accent,
    borderRadius: atomRadii.full,
    height: 9,
    width: 9
  },
  progressFill: {
    backgroundColor: atomPalette.accent,
    height: "100%"
  },
  progressMeterBlock: {
    gap: atomSpacing[5],
    paddingTop: atomSpacing[8]
  },
  progressMeterLabels: {
    flexDirection: "row",
    gap: atomSpacing[2],
    justifyContent: "space-between"
  },
  progressMeterLabel: {
    flex: 1,
    fontSize: 9,
    lineHeight: 12
  },
  progressMeterLabelCenter: {
    textAlign: "center"
  },
  progressMeterLabelRight: {
    textAlign: "right"
  },
  progressMetric: {
    alignItems: "flex-end",
    flexShrink: 1,
    gap: atomSpacing[2],
    maxWidth: "46%",
    minWidth: 0,
    paddingBottom: atomSpacing[3]
  },
  progressMetricValue: {
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    lineHeight: 26
  },
  progressNumber: {
    color: atomPalette.accent,
    fontSize: 92,
    fontVariant: ["tabular-nums"],
    letterSpacing: -5,
    lineHeight: 96
  },
  progressNumberRow: {
    alignItems: "flex-end",
    flexDirection: "row"
  },
  progressPercent: {
    fontSize: 34,
    lineHeight: 48,
    paddingBottom: atomSpacing[2]
  },
  progressPhaseTitle: {
    fontSize: 42,
    letterSpacing: -1.2,
    lineHeight: 48,
    paddingTop: atomSpacing[5]
  },
  progressTrack: {
    backgroundColor: atomPalette.surfaceLow,
    height: 6,
    overflow: "hidden"
  },
  progressValuesRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: atomSpacing[4],
    justifyContent: "space-between",
    paddingTop: atomSpacing[10]
  },
  titleContent: {
    flex: 1,
    minWidth: 0
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: atomSpacing[4],
    justifyContent: "space-between"
  },
  webCursor: {
    cursor: "pointer"
  } as ViewStyle
});
