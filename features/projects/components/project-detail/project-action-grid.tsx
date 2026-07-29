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
    icon: UserIcon,
    index: "03",
    label: "TEAM",
    target: "team"
  },
  {
    accent: false,
    icon: AlertIcon,
    index: "04",
    label: "INCIDENT_LOG",
    target: null
  },
  {
    accent: false,
    icon: ListChecksIcon,
    index: "05",
    label: "TO_DO_LIST",
    target: null
  },
  {
    accent: true,
    icon: CirclePlusIcon,
    index: "06",
    label: "DAILY_REPORT",
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
            expanded={expanded}
            key={action.index}
            onPress={
              canOpen
                ? () =>
                    router.push(
                      `/projects/${projectId}/${action.target}` as never
                    )
                : undefined
            }
            {...action}
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
