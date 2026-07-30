import { ClientDetailContent } from "@/features/clients/components/client-detail/client-detail-content";
import { useClient } from "@/features/clients/hooks/use-clients";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { atomSpacing } from "@/shared/ui/components/theme";
import { RefreshIcon, UserIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function ClientDetailScreen({
  clientId
}: {
  clientId?: string;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/clients");
  const { t: tShared } = useTranslation("shared");
  const clientQuery = useClient(clientId);
  const backToClients = {
    label: t(($) => $["features/clients"].accessibility.backToClients),
    onPress: () => router.replace("/directory?section=clients" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: { action: backToClients },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: tShared(($) => $.shared.actions.retry),
            onPress: () => void clientQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            clientQuery.error,
            t(($) => $["features/clients"].errors.load)
          ),
          icon: UserIcon
        },
        notFound: { action: backToClients, icon: UserIcon }
      }}
      isError={clientQuery.isError}
      isInvalid={!clientId}
      isLoading={clientQuery.isLoading}
      isNotFound={!clientQuery.data}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={48} width="55%" />
            <SkeletonBlock height={220} />
          </View>
        </Screen>
      }
      resourceName={t(($) => $["features/clients"].fields.client)}
    >
      {clientQuery.data ? (
        <ClientDetailContent client={clientQuery.data} />
      ) : null}
    </RouteStateBoundary>
  );
}
