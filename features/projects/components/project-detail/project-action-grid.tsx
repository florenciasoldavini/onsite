import { projectDetailStyles } from "@/features/projects/components/project-detail/project-detail.styles";
import { AppText } from "@/shared/ui/components/text";
import { atomPalette } from "@/shared/ui/components/theme";
import {
  AlertIcon,
  CameraIcon,
  CirclePlusIcon,
  FolderOpenIcon,
  ListChecksIcon,
  UserIcon
} from "@/shared/ui/icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

const projectActions = [
  {
    accent: false,
    icon: FolderOpenIcon,
    index: "01",
    label: "documentation",
    target: "documents"
  },
  {
    accent: false,
    icon: CameraIcon,
    index: "02",
    label: "photos",
    target: "photos"
  },
  {
    accent: false,
    icon: UserIcon,
    index: "03",
    label: "team",
    target: "team"
  },
  {
    accent: false,
    icon: AlertIcon,
    index: "04",
    label: "incidentLog",
    target: null
  },
  {
    accent: false,
    icon: ListChecksIcon,
    index: "05",
    label: "todoList",
    target: null
  },
  {
    accent: true,
    icon: CirclePlusIcon,
    index: "06",
    label: "dailyReport",
    target: null
  }
] as const;

export function ProjectActionGrid({
  canReadMembers,
  expanded,
  projectId
}: {
  canReadMembers: boolean;
  expanded: boolean;
  projectId: string;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/projects");
  const labels = {
    dailyReport: t(($) => $["features/projects"].detail.dailyReport),
    documentation: t(($) => $["features/projects"].detail.documentation),
    incidentLog: t(($) => $["features/projects"].detail.incidentLog),
    photos: t(($) => $["features/projects"].detail.photos),
    team: t(($) => $["features/projects"].detail.team),
    todoList: t(($) => $["features/projects"].detail.todoList)
  };

  return (
    <View
      style={[
        projectDetailStyles.actionGrid,
        expanded ? projectDetailStyles.actionGridExpanded : null
      ]}
    >
      {projectActions.map((action) => {
        const canOpen =
          action.target && (action.target !== "team" || canReadMembers);

        return (
          <ProjectActionCard
            {...action}
            expanded={expanded}
            key={action.index}
            label={labels[action.label]}
            onPress={
              canOpen
                ? () =>
                    router.push(
                      `/projects/${projectId}/${action.target}` as never
                    )
                : undefined
            }
          />
        );
      })}
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
}: Omit<(typeof projectActions)[number], "label"> & {
  expanded: boolean;
  label: string;
  onPress?: () => void;
}) {
  const { t } = useTranslation("features/projects");
  const [isHovered, setIsHovered] = useState(false);
  const iconColor = accent ? atomPalette.accentText : atomPalette.textMuted;
  const textTone = accent ? "inverse" : "default";

  return (
    <Pressable
      accessibilityHint={
        onPress
          ? t(($) => $["features/projects"].detail.openHint)
          : t(($) => $["features/projects"].detail.futureHint)
      }
      accessibilityLabel={label.replaceAll("_", " ").toLowerCase()}
      accessibilityRole="button"
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        projectDetailStyles.actionCard,
        expanded ? projectDetailStyles.actionCardExpanded : null,
        accent
          ? projectDetailStyles.actionCardAccent
          : projectDetailStyles.actionCardDefault,
        isHovered && !accent ? projectDetailStyles.actionCardHovered : null,
        pressed ? projectDetailStyles.actionCardPressed : null,
        process.env.EXPO_OS === "web" ? projectDetailStyles.webCursor : null
      ]}
    >
      <Icon color={iconColor} size={30} strokeWidth={2} />

      <View style={projectDetailStyles.actionLabel}>
        <AppText
          style={projectDetailStyles.actionLabelText}
          tone={textTone}
          variant="label"
        >
          {index}_
        </AppText>
        <AppText
          numberOfLines={2}
          style={projectDetailStyles.actionLabelText}
          tone={textTone}
          variant="label"
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}
