import { projectDetailStyles } from "@/features/projects/components/project-detail/project-detail.styles";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { View } from "react-native";

export function ProjectDetailSkeleton() {
  return (
    <Screen>
      <View style={projectDetailStyles.pageStack}>
        <SkeletonBlock height={24} width="35%" />
        <SkeletonBlock height={120} />
        <SkeletonBlock height={320} />
      </View>
    </Screen>
  );
}
