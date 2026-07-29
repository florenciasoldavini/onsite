import { ProjectInvitationsScreen } from "@/features/projects/screens/project-invitations-screen";
import { parseOptionalUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function ProjectInvitationsRoute() {
  const params = useLocalSearchParams<{
    invitation?: string | string[];
  }>();
  const invitationId = parseOptionalUuidRouteParam(params.invitation);

  return <ProjectInvitationsScreen highlightedInvitationId={invitationId} />;
}
