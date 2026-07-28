import {
  findSelectedCatalogItem,
  getCatalogContactSummary
} from "@/shared/ui/components/catalog-picker-state";
import { describe, expect, it } from "vitest";

describe("catalog picker state", () => {
  it("prefers a matching paginated item over the fallback record", () => {
    const listedItem = { id: "selected", name: "Listed" };
    const fallback = { id: "selected", name: "Fallback" };

    expect(
      findSelectedCatalogItem({
        fallback,
        items: [listedItem],
        value: "selected"
      })
    ).toBe(listedItem);
  });

  it("uses the fallback when the selected record is outside loaded pages", () => {
    const fallback = { id: "selected", name: "Fallback" };

    expect(
      findSelectedCatalogItem({
        fallback,
        items: [{ id: "other", name: "Other" }],
        value: "selected"
      })
    ).toBe(fallback);
  });

  it("formats available contact details with a safe empty fallback", () => {
    expect(
      getCatalogContactSummary({
        email: "person@example.com",
        id: "person",
        phone_number: "+1 555 0100"
      })
    ).toBe("+1 555 0100 · person@example.com");
    expect(getCatalogContactSummary({ id: "person" })).toBe(
      "No contact details"
    );
  });
});
