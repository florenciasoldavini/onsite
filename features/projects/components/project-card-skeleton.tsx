import { AppCard } from "@/shared/ui/components/card";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { atomSpacing } from "@/shared/ui/components/theme";
import { View } from "react-native";

export function ProjectCardSkeleton() {
  return (
    <AppCard padding="md">
      <View style={{ gap: atomSpacing[4] }}>
        <SkeletonBlock height={150} radius={12} />
        <View style={{ gap: atomSpacing[3] }}>
          <SkeletonBlock height={12} width={96} />
          <SkeletonBlock height={24} width="72%" />
          <SkeletonBlock height={16} width="90%" />
          <SkeletonBlock height={16} width="52%" />
        </View>
      </View>
    </AppCard>
  );
}
