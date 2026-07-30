import {
  buildDocumentListQueryPlan,
  buildDocumentSearchFilter
} from "@/features/documents/repositories/document-list-query";
import {
  createDocumentFormSchema,
  normalizeDocumentFilters
} from "@/features/documents/schemas/document.schema";

const t = ((selector: (resources: never) => string) => {
  try {
    return selector({} as never);
  } catch {
    return "validation";
  }
}) as never;

describe("project document query and form contracts", () => {
  it("escapes Storage query syntax and searches both filenames", () => {
    expect(buildDocumentSearchFilter('plan\\"final')).toBe(
      'name.ilike."%plan\\\\\\"final%",original_filename.ilike."%plan\\\\\\"final%"'
    );
  });

  it("normalizes whitespace and the all-category filter", () => {
    expect(
      normalizeDocumentFilters({ category: "all", query: "  permit  " })
    ).toEqual({ category: null, query: "permit" });
    expect(
      buildDocumentListQueryPlan({
        category: "permit",
        query: " permit "
      })
    ).toEqual({
      category: "permit",
      search:
        'name.ilike."%permit%",original_filename.ilike."%permit%"'
    });
  });

  it("requires a category and enforces the 160-character display name", () => {
    const schema = createDocumentFormSchema(t);
    expect(schema.safeParse({ category: "drawing", name: " Plan " }).success)
      .toBe(true);
    expect(schema.safeParse({ category: "drawing", name: " " }).success)
      .toBe(false);
    expect(
      schema.safeParse({ category: "drawing", name: "a".repeat(161) })
        .success
    ).toBe(false);
    expect(schema.safeParse({ category: "", name: "Plan" }).success).toBe(
      false
    );
  });
});
