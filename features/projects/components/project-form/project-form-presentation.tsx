import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppHeading } from "@/shared/ui/components/heading";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("features/projects");

  return (
    <View style={{ gap: atomSpacing[3] }}>
      <Breadcrumb
        items={[
          {
            accessibilityLabel: t(
              ($) => $["features/projects"].actions.backProjects
            ),
            label: t(($) => $["features/projects"].list.title),
            onPress: () => router.replace("/projects" as never)
          },
          ...(mode === "edit" && projectId
            ? [
                {
                  accessibilityLabel: t(
                    ($) => $["features/projects"].form.backDetail
                  ),
                  label: t(($) => $["features/projects"].detail.title),
                  onPress: () =>
                    router.replace(`/projects/${projectId}` as never)
                }
              ]
            : []),
          {
            label: t(($) =>
              mode === "create"
                ? $["features/projects"].form.createTitle
                : $["features/projects"].form.editTitle
            )
          }
        ]}
      />
      <AppHeading variant="hero">
        {t(($) =>
          mode === "create"
            ? $["features/projects"].form.createHeading
            : $["features/projects"].form.editHeading
        )}
      </AppHeading>
      <AppText tone="muted">
        {t(($) => $["features/projects"].form.description)}
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
