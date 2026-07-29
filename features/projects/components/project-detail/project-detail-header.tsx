import { projectDetailStyles } from "@/features/projects/components/project-detail/project-detail.styles";
import { useProjectAccess } from "@/features/projects/hooks/use-project-collaboration";
import { useSoftDeleteProject } from "@/features/projects/hooks/use-projects";
import type { Project } from "@/features/projects/types/project.types";
import { AppButton } from "@/shared/ui/components/button";
import {
  DestructiveConfirmationDialog,
  useDestructiveConfirmation
} from "@/shared/ui/components/destructive-confirmation-dialog";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { useAppToast } from "@/shared/ui/components/toast";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import { MoreVerticalIcon, PencilIcon, TrashIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutRectangle
} from "react-native";

export function ProjectDetailHeader({ project }: { project: Project }) {
  return (
    <View style={projectDetailStyles.titleRow}>
      <AppHeading
        selectable
        style={projectDetailStyles.titleContent}
        variant="hero"
      >
        {project.name}
      </AppHeading>
      <ProjectActionsMenu projectId={project.id} projectName={project.name} />
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
  const accessQuery = useProjectAccess(projectId);
  const canEdit = accessQuery.can("project.update");
  const canDelete = accessQuery.can("project.delete");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const deleteConfirmation = useDestructiveConfirmation();
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(
    null
  );
  const menuWidth = 184;
  const menuHeight = (Number(canEdit) + Number(canDelete)) * 50;
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
    setIsMenuOpen(true);
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ height, width, x, y });
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

  if (!canEdit && !canDelete) {
    return null;
  }

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
              projectDetailStyles.actionsMenu,
              { left: menuLeft, top: menuTop, width: menuWidth }
            ]}
          >
            {canEdit ? (
              <ActionMenuItem
                icon={PencilIcon}
                label="Edit"
                onPress={() => {
                  setIsMenuOpen(false);
                  router.push(`/projects/${projectId}/edit` as never);
                }}
              />
            ) : null}
            {canDelete ? (
              <ActionMenuItem
                danger
                icon={TrashIcon}
                label="Delete"
                onPress={() => {
                  setIsMenuOpen(false);
                  deleteConfirmation.open();
                }}
              />
            ) : null}
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
        projectDetailStyles.actionsMenuItem,
        pressed ? projectDetailStyles.actionsMenuItemPressed : null,
        process.env.EXPO_OS === "web" ? projectDetailStyles.webCursor : null
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
