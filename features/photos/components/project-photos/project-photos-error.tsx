import { InlineErrorState } from "@/shared/ui/components/inline-error-state";
import { AlertIcon, RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";

export function ProjectPhotosError({
  error,
  onRetry
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <InlineErrorState
      action={{ icon: RefreshIcon, label: "Retry", onPress: onRetry }}
      description={getUserFacingErrorMessage(
        error,
        "We couldn't load the project photos. Check your connection and try again."
      )}
      icon={AlertIcon}
      title="Photos unavailable"
    />
  );
}
