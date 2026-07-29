import { SupplierDetailContent } from "@/features/suppliers/components/supplier-detail/supplier-detail-content";
import { useSupplier } from "@/features/suppliers/hooks/use-suppliers";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { atomSpacing } from "@/shared/ui/components/theme";
import { RefreshIcon, StoreIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { View } from "react-native";

export default function SupplierDetailScreen({
  supplierId
}: {
  supplierId?: string;
}) {
  const router = useRouter();
  const supplierQuery = useSupplier(supplierId);
  const backToDirectory = {
    label: "Back to directory",
    onPress: () => router.replace("/directory?section=suppliers" as never)
  };

  return (
    <RouteStateBoundary
      feedback={{
        invalidParams: { action: backToDirectory, icon: StoreIcon },
        loadError: {
          action: {
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void supplierQuery.refetch()
          },
          description: getUserFacingErrorMessage(
            supplierQuery.error,
            "We couldn't load this supplier. Try again."
          ),
          icon: StoreIcon
        },
        notFound: { action: backToDirectory, icon: StoreIcon }
      }}
      isError={supplierQuery.isError}
      isInvalid={!supplierId}
      isLoading={supplierQuery.isLoading}
      isNotFound={!supplierQuery.data}
      loadingFallback={
        <Screen>
          <View style={{ gap: atomSpacing[5] }}>
            <SkeletonBlock height={220} />
            <SkeletonBlock height={320} />
          </View>
        </Screen>
      }
      resourceName="supplier"
    >
      {supplierQuery.data ? (
        <SupplierDetailContent supplier={supplierQuery.data} />
      ) : null}
    </RouteStateBoundary>
  );
}
