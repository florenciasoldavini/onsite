export interface CatalogContactItem {
  email?: string | null;
  id: string;
  phone_number?: string | null;
}

export function findSelectedCatalogItem<TItem extends { id: string }>({
  fallback,
  items,
  value
}: {
  fallback?: TItem | null;
  items: readonly TItem[];
  value: string | null;
}) {
  return items.find((item) => item.id === value) ?? fallback ?? null;
}

export function getCatalogContactSummary(item: CatalogContactItem) {
  return (
    [item.phone_number, item.email].filter(Boolean).join(" · ") ||
    "No contact details"
  );
}
