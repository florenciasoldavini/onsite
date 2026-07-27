import ClientsScreen from "@/features/clients/screens/clients-screen";
import ContractorsScreen from "@/features/contractors/screens/contractors-screen";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { AppButton } from "@/shared/ui/components/button";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { SegmentedTabs } from "@/shared/ui/components/tabs";
import { atomSpacing } from "@/shared/ui/components/theme";
import { PlusIcon } from "@/shared/ui/icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";

type DirectorySection = "clients" | "contractors";

const directorySections = [
  { label: "Clients", value: "clients" },
  { label: "Contractors", value: "contractors" }
] satisfies { label: string; value: DirectorySection }[];

export default function DirectoryScreen() {
  const router = useRouter();
  const { isCompact, isExpanded } = useLayoutMode();
  const params = useLocalSearchParams<{ section?: string | string[] }>();
  const requestedSection = Array.isArray(params.section)
    ? params.section[0]
    : params.section;
  const section: DirectorySection =
    requestedSection === "contractors" ? "contractors" : "clients";
  const isClients = section === "clients";
  const createRoute = isClients ? "/clients/new" : "/contractors/new";

  const directoryHeader = (
    <View style={{ gap: atomSpacing[5] }}>
      <NavScreenHeader
        action={
          !isCompact ? (
            <AppButton
              fullWidth={false}
              icon={PlusIcon}
              iconAfter={false}
              onPress={() => router.push(createRoute as never)}
              size="sm"
            >
              {isClients ? "New client" : "New contractor"}
            </AppButton>
          ) : null
        }
        description="Manage the people connected to your construction work."
        title="Directory"
      />
      <View
        style={{
          alignSelf: isExpanded ? "flex-start" : "stretch",
          maxWidth: isExpanded ? 420 : undefined,
          width: isExpanded ? 420 : "100%"
        }}
      >
        <SegmentedTabs
          onChange={(nextSection) =>
            router.setParams({ section: nextSection })
          }
          options={directorySections}
          selectedTone="accent"
          value={section}
        />
      </View>
    </View>
  );

  return isClients ? (
    <ClientsScreen directoryHeader={directoryHeader} />
  ) : (
    <ContractorsScreen directoryHeader={directoryHeader} />
  );
}
