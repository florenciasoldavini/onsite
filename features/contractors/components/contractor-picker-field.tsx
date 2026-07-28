import {
  useContractor,
  useContractors
} from "@/features/contractors/hooks/use-contractors";
import { getContractorDisplayName } from "@/features/contractors/schemas/contractor.schema";
import { CatalogPickerField } from "@/shared/ui/components/catalog-picker-field";
import { HardHatIcon } from "@/shared/ui/icons";
import { useState } from "react";

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
  const selectedContractorQuery = useContractor(value ?? undefined);

  return (
    <CatalogPickerField
      entityName="contractor"
      entityNamePlural="contractors"
      getDisplayName={getContractorDisplayName}
      hasNextPage={contractorsQuery.hasNextPage}
      icon={HardHatIcon}
      isError={contractorsQuery.isError}
      isFetchingNextPage={contractorsQuery.isFetchingNextPage}
      isLoading={contractorsQuery.isLoading}
      label="Contractor"
      onChange={onChange}
      onLoadMore={() => void contractorsQuery.fetchNextPage()}
      onQueryChange={setQuery}
      pages={contractorsQuery.data?.pages}
      query={query}
      selectedItemFallback={selectedContractorQuery.data}
      value={value}
    />
  );
}
