import { ProjectInvitationAcceptScreen } from "@/features/projects/screens/project-invitation-accept-screen";
import { getUrlFragmentParam } from "@/shared/utils/route-params";
import * as Linking from "expo-linking";
import { useMemo } from "react";

export default function ProjectInvitationAcceptRoute() {
  const linkingUrl = Linking.useURL();
  const token = useMemo(
    () => getUrlFragmentParam(linkingUrl, "token"),
    [linkingUrl]
  );

  return <ProjectInvitationAcceptScreen token={token} />;
}
