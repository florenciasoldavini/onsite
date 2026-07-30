import { ProjectInvitationLandingContent } from "@/features/projects/components/project-invitations/project-invitation-landing-content";
import { useProjectInvitationPreview } from "@/features/projects/hooks/use-project-collaboration";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AlertIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useTranslation } from "react-i18next";

export function ProjectInvitationAcceptScreen({ token }: { token?: string }) {
  const { t } = useTranslation("features/projects");
  const preview = useProjectInvitationPreview(token);

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: {
          description: t(
            ($) => $["features/projects"].invitations.incompleteDescription
          ),
          icon: AlertIcon,
          title: t(
            ($) => $["features/projects"].invitations.incompleteTitle
          )
        },
        loadError: {
          description: getUserFacingErrorMessage(
            preview.error,
            t(($) => $["features/projects"].invitations.invalid)
          ),
          icon: AlertIcon,
          title: t(($) => $["features/projects"].invitations.unavailable)
        },
        notFound: {
          description: t(
            ($) => $["features/projects"].invitations.invalid
          ),
          icon: AlertIcon,
          title: t(($) => $["features/projects"].invitations.unavailable)
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
