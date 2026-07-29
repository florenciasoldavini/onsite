import { ProjectInvitationAcceptScreen } from "@/features/projects/screens/project-invitation-accept-screen";
import * as Linking from "expo-linking";
import { useMemo } from "react";

export default function ProjectInvitationAcceptRoute() {
  const linkingUrl = Linking.useURL();
  const token = useMemo(() => getInvitationToken(linkingUrl), [linkingUrl]);

  return <ProjectInvitationAcceptScreen token={token} />;
}

function getInvitationToken(url: string | null) {
  if (!url) return undefined;

  try {
    const hash = new URL(url).hash.replace(/^#/, "");
    return new URLSearchParams(hash).get("token") ?? undefined;
  } catch {
    return undefined;
  }
}
