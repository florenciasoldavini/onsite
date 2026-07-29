import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppHeading } from "@/shared/ui/components/heading";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

export const projectFormStyles = StyleSheet.create({
  formCardExpanded: {
    alignSelf: "center",
    width: "100%"
  },
  formContent: {
    gap: atomSpacing[5]
  },
  page: {
    gap: atomSpacing[6],
    width: "100%"
  },
  pageExpanded: {
    alignSelf: "center",
    maxWidth: 1120
  }
});

export function ProjectFormHeader({
  mode,
  projectId
}: {
  mode: "create" | "edit";
  projectId?: string;
}) {
  const router = useRouter();

  return (
    <View style={{ gap: atomSpacing[3] }}>
      <Breadcrumb
        items={[
          {
            accessibilityLabel: "Back to projects",
            label: "Projects",
            onPress: () => router.replace("/projects" as never)
          },
          ...(mode === "edit" && projectId
            ? [
                {
                  accessibilityLabel: "Back to project detail",
                  label: "Project Detail",
                  onPress: () =>
                    router.replace(`/projects/${projectId}` as never)
                }
              ]
            : []),
          { label: mode === "create" ? "New" : "Edit" }
        ]}
      />
      <AppHeading variant="hero">
        {mode === "create" ? "Create a project." : "Update project details."}
      </AppHeading>
      <AppText tone="muted">
        Projects anchor site tasks, uploads, location, and future client-facing
        work.
      </AppText>
    </View>
  );
}

export function ProjectFormSkeleton() {
  return (
    <Screen>
      <View style={{ gap: atomSpacing[5] }}>
        <SkeletonBlock height={36} width="50%" />
        <SkeletonBlock height={220} />
        <SkeletonBlock height={320} />
      </View>
    </Screen>
  );
}
