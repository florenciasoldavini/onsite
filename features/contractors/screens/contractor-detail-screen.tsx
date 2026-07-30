import { ContractorDetailContent } from "@/features/contractors/components/contractor-detail/contractor-detail-content";
import { useContractor } from "@/features/contractors/hooks/use-contractors";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { atomSpacing } from "@/shared/ui/components/theme";
import { HardHatIcon, RefreshIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

export default function ContractorDetailScreen({
  contractorId
}: {
  contractorId?: string;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/contractors");
  const { t: tShared } = useTranslation("shared");
  const contractorQuery = useContractor(contractorId);
  const backToDirectory = {
    label: t(($) => $["features/contractors"].accessibility.backToDirectory),
    onPress: () => router.replace("/directory?section=contractors" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: { action: backToDirectory, icon: HardHatIcon },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: tShared(($) => $.shared.actions.retry),
            onPress: () => void contractorQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            contractorQuery.error,
            t(($) => $["features/contractors"].errors.load)
          ),
          icon: HardHatIcon
        },
        notFound: { action: backToDirectory, icon: HardHatIcon }
      }}
      isError={contractorQuery.isError}
      isInvalid={!contractorId}
      isLoading={contractorQuery.isLoading}
      isNotFound={!contractorQuery.data}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={48} width="55%" />
            <SkeletonBlock height={300} />
          </View>
        </Screen>
      }
      resourceName={t(($) => $["features/contractors"].fields.contractor)}
    >
      {contractorQuery.data ? (
        <ContractorDetailContent contractor={contractorQuery.data} />
      ) : null}
    </RouteStateBoundary>
  );
}
