import { ProjectInvitationLandingContent } from "@/features/projects/components/project-invitations/project-invitation-landing-content";
import { useProjectInvitationPreview } from "@/features/projects/hooks/use-project-collaboration";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AlertIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";

export function ProjectInvitationAcceptScreen({ token }: { token?: string }) {
  const preview = useProjectInvitationPreview(token);

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: {
          description: "Open the complete link from your invitation email.",
          icon: AlertIcon,
          title: "Invitation link incomplete"
        },
        loadError: {
          description: getUserFacingErrorMessage(
            preview.error,
            "This invitation is invalid or no longer available."
          ),
          icon: AlertIcon,
          title: "Invitation unavailable"
        },
        notFound: {
          description: "This invitation is invalid or no longer available.",
          icon: AlertIcon,
          title: "Invitation unavailable"
        }
      }}
      isError={preview.isError}
      isInvalid={!token}
      isLoading={preview.isLoading}
      isNotFound={!preview.data}
      loadingFallback={
        <Screen centered>
          <SkeletonBlock height={260} width="100%" />
        </Screen>
      }
      resourceName="invitation"
    >
      {preview.data ? (
        <ProjectInvitationLandingContent invitation={preview.data} />
      ) : null}
    </RouteStateBoundary>
  );
}
