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

type DirectorySection = "clients" | "contractors" | "suppliers" | "workers";

const directorySections = [
  {
    createLabel: "New client",
    createRoute: "/clients/new",
    label: "Clients",
    Screen: ClientsScreen,
    value: "clients"
  },
  {
    createLabel: "New contractor",
    createRoute: "/contractors/new",
    label: "Contractors",
    Screen: ContractorsScreen,
    value: "contractors"
  },
  {
    createLabel: "New worker",
    createRoute: "/workers/new",
    label: "Workers",
    Screen: WorkersScreen,
    value: "workers"
  },
  {
    createLabel: "New supplier",
    createRoute: "/suppliers/new",
    label: "Suppliers",
    Screen: SuppliersScreen,
    value: "suppliers"
  }
] satisfies {
  createLabel: string;
  createRoute: string;
  label: string;
  Screen: typeof ClientsScreen;
  value: DirectorySection;
}[];

const directorySectionOptions = directorySections.map(({ label, value }) => ({
  label,
  value
}));

export default function DirectoryScreen({
  requestedSection
}: {
  requestedSection?: string;
}) {
  const router = useRouter();
  const { isCompact, isExpanded } = useLayoutMode();
  const selectedConfig =
    directorySections.find(({ value }) => value === requestedSection) ??
    directorySections[0];
  const section = selectedConfig.value;
  const SectionScreen = selectedConfig.Screen;

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
              {selectedConfig.createLabel}
            </AppButton>
          ) : null
        }
        description="Manage the people and businesses connected to your construction work."
        title="Directory"
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
            accessibilityLabel="Choose directory section"
            labelPrefix="Directory"
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
