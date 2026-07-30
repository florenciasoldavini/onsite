import { InlineErrorState } from "@/shared/ui/components/inline-error-state";
import { AlertIcon, RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useTranslation } from "react-i18next";

export function ProjectPhotosError({
  error,
  onRetry
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const { t } = useTranslation("features/photos");
  const { t: tShared } = useTranslation("shared");
  return (
    <InlineErrorState
      action={{
        icon: RefreshIcon,
        label: tShared(($) => $.shared.actions.retry),
        onPress: onRetry
      }}
      description={getUserFacingErrorMessage(
        error,
        t(($) => $["features/photos"].errors.loadList)
      )}
      icon={AlertIcon}
      title={t(($) => $["features/photos"].errors.listUnavailable)}
    />
  );
}
