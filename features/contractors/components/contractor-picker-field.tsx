import {
  useContractor,
  useContractors
} from "@/features/contractors/hooks/use-contractors";
import { getContractorDisplayName } from "@/features/contractors/schemas/contractor.schema";
import type { ContractorSummary } from "@/features/contractors/types/contractor";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { SearchField } from "@/shared/ui/components/input";
import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { HardHatIcon } from "@/shared/ui/icons";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";

export function ContractorPickerField({
  onChange,
  ownerId,
  value
}: {
  onChange: (contractorId: string | null) => void;
  ownerId?: string;
  value: string | null;
}) {
  const [query, setQuery] = useState("");
  const contractorsQuery = useContractors({
    ownerId,
    query,
    sort: "name_asc"
  });
  const contractors = useMemo(
    () => contractorsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [contractorsQuery.data]
  );
  const selectedContractorQuery = useContractor(value ?? undefined);
  const selectedContractor =
    contractors.find((contractor) => contractor.id === value) ??
    selectedContractorQuery.data ??
    null;

  return (
    <View style={{ gap: atomSpacing[3] }}>
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between"
        }}
      >
        <AppText variant="label">Contractor</AppText>
        <AppText tone="subtle" variant="meta">
          (optional)
        </AppText>
      </View>
      {selectedContractor ? (
        <SelectedContractor
          contractor={selectedContractor}
          onClear={() => onChange(null)}
        />
      ) : null}
      <SearchField
        onChangeText={setQuery}
        placeholder="Search by name, phone, or email"
        size="md"
        value={query}
      />
      <AppCard padding="sm" tone="muted">
        <View style={{ gap: atomSpacing[2] }}>
          {contractorsQuery.isLoading ? (
            <AppText tone="muted">Loading contractors…</AppText>
          ) : contractorsQuery.isError ? (
            <AppText tone="danger">
              We couldn&apos;t load contractors. Try again.
            </AppText>
          ) : contractors.length === 0 ? (
            <AppText tone="muted">No matching contractors.</AppText>
          ) : (
            contractors.map((contractor) => (
              <Pressable
                accessibilityRole="button"
                key={contractor.id}
                onPress={() => onChange(contractor.id)}
                style={({ pressed }) => ({
                  backgroundColor:
                    value === contractor.id
                      ? `${atomPalette.accent}12`
                      : atomPalette.surface,
                  borderRadius: atomRadii.md,
                  opacity: pressed ? 0.78 : 1,
                  padding: atomSpacing[3]
                })}
              >
                <AppText variant="label">
                  {getContractorDisplayName(contractor)}
                </AppText>
                {contractor.phone_number || contractor.email ? (
                  <AppText tone="muted" variant="bodySm">
                    {[contractor.phone_number, contractor.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </AppText>
                ) : null}
              </Pressable>
            ))
          )}
          {contractorsQuery.hasNextPage ? (
            <AppButton
              color="neutral"
              loading={contractorsQuery.isFetchingNextPage}
              onPress={() => void contractorsQuery.fetchNextPage()}
              size="sm"
              variant="ghost"
            >
              Load more contractors
            </AppButton>
          ) : null}
        </View>
      </AppCard>
    </View>
  );
}

function SelectedContractor({
  contractor,
  onClear
}: {
  contractor: ContractorSummary;
  onClear: () => void;
}) {
  return (
    <AppCard padding="sm">
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          gap: atomSpacing[3]
        }}
      >
        <HardHatIcon color={atomPalette.accent} size="md" />
        <View style={{ flex: 1 }}>
          <AppText variant="label">
            {getContractorDisplayName(contractor)}
          </AppText>
          <AppText tone="muted" variant="bodySm">
            {[contractor.phone_number, contractor.email]
              .filter(Boolean)
              .join(" · ") || "No contact details"}
          </AppText>
        </View>
        <AppButton
          color="neutral"
          fullWidth={false}
          onPress={onClear}
          size="sm"
          variant="ghost"
        >
          Clear
        </AppButton>
      </View>
    </AppCard>
  );
}
