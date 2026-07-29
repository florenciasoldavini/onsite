import { ProjectInvitationsScreen } from "@/features/projects/screens/project-invitations-screen";
import { useLocalSearchParams } from "expo-router";

export default function ProjectInvitationsRoute() {
  const params = useLocalSearchParams<{
    invitation?: string | string[];
  }>();
  const invitationId = Array.isArray(params.invitation)
    ? params.invitation[0]
    : params.invitation;

  return <ProjectInvitationsScreen highlightedInvitationId={invitationId} />;
}
