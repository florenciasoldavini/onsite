import ClientsScreen from "@/features/clients/screens/clients-screen";
import ContractorsScreen from "@/features/contractors/screens/contractors-screen";
import SuppliersScreen from "@/features/suppliers/screens/suppliers-screen";
import WorkersScreen from "@/features/workers/screens/workers-screen";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppButton } from "@/shared/ui/components/button";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { SelectMenu } from "@/shared/ui/components/select-menu";
import { SegmentedTabs } from "@/shared/ui/components/tabs";
import { atomSpacing } from "@/shared/ui/components/theme";
import { PlusIcon } from "@/shared/ui/icons";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

type DirectorySection = "clients" | "contractors" | "suppliers" | "workers";

const directorySections = [
  {
    createKey: "client",
    createRoute: "/clients/new",
    labelKey: "clients",
    Screen: ClientsScreen,
    value: "clients"
  },
  {
    createKey: "contractor",
    createRoute: "/contractors/new",
    labelKey: "contractors",
    Screen: ContractorsScreen,
    value: "contractors"
  },
  {
    createKey: "worker",
    createRoute: "/workers/new",
    labelKey: "workers",
    Screen: WorkersScreen,
    value: "workers"
  },
  {
    createKey: "supplier",
    createRoute: "/suppliers/new",
    labelKey: "suppliers",
    Screen: SuppliersScreen,
    value: "suppliers"
  }
] satisfies {
  createKey: "client" | "contractor" | "supplier" | "worker";
  createRoute: string;
  labelKey: DirectorySection;
  Screen: typeof ClientsScreen;
  value: DirectorySection;
}[];

export default function DirectoryScreen({
  requestedSection
}: {
  requestedSection?: string;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/directory");
  const { isCompact, isExpanded } = useLayoutMode();
  const selectedConfig =
    directorySections.find(({ value }) => value === requestedSection) ??
    directorySections[0];
  const section = selectedConfig.value;
  const SectionScreen = selectedConfig.Screen;
  const directorySectionOptions = directorySections.map(
    ({ labelKey, value }) => ({
      label: t(($) => $["features/directory"].sections[labelKey]),
      value
    })
  );
  const createLabel = t(
    ($) => $["features/directory"].create[selectedConfig.createKey]
  );

  const directoryHeader = (
    <View style={{ gap: atomSpacing[5] }}>
      <NavScreenHeader
        action={
          !isCompact ? (
            <AppButton
              fullWidth={false}
              icon={PlusIcon}
              iconAfter={false}
              onPress={() => router.push(selectedConfig.createRoute as never)}
              size="sm"
            >
              {createLabel}
            </AppButton>
          ) : null
        }
        description={t(($) => $["features/directory"].description)}
        title={t(($) => $["features/directory"].title)}
      />
      <View
        style={{
          alignSelf: isExpanded ? "flex-start" : "stretch",
          maxWidth: isExpanded ? 560 : undefined,
          width: isExpanded ? 560 : "100%"
        }}
      >
        {isCompact ? (
          <SelectMenu
            accessibilityLabel={t(
              ($) => $["features/directory"].accessibility.chooseSection
            )}
            labelPrefix={t(($) => $["features/directory"].title)}
            minWidth={220}
            onChange={(nextSection) =>
              router.setParams({ section: nextSection })
            }
            options={directorySectionOptions}
            value={section}
          />
        ) : (
          <SegmentedTabs
            onChange={(nextSection) =>
              router.setParams({ section: nextSection })
            }
            options={directorySectionOptions}
            selectedTone="accent"
            value={section}
          />
        )}
      </View>
    </View>
  );

  return <SectionScreen directoryHeader={directoryHeader} />;
}
