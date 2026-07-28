import {
  getSupplierInitials,
  normalizeSupplierFilters,
  normalizeWebsiteUrl,
  SupplierSchema,
  supplierFormSchema,
  toSupplierInput
} from "@/features/suppliers/schemas/supplier.schema";

const resolvedAddress = {
  address: "Av. Corrientes 1234, Buenos Aires",
  latitude: -34.6037,
  longitude: -58.3816,
  placeId: "place-123"
};

describe("supplier schema", () => {
  it("parses persisted supplier timestamps and nullable fields", () => {
    expect(
      SupplierSchema.safeParse({
        address: null,
        contact_name: null,
        created_at: "2026-07-27T18:00:00.000Z",
        deleted_at: null,
        email: null,
        google_place_id: null,
        id: "supplier-1",
        latitude: null,
        longitude: null,
        name: "Patagonia Supply",
        notes: null,
        owner_id: "owner-1",
        phone_number: null,
        updated_at: null,
        website_url: null
      }).success
    ).toBe(true);
  });

  it("normalizes optional contact, website, notes, and address values", () => {
    expect(
      toSupplierInput({
        address: resolvedAddress,
        contact_name: "  Alex Morgan ",
        email: " SALES@EXAMPLE.COM ",
        name: "  Patagonia Supply ",
        notes: "  Delivers on Fridays. ",
        phone_number: " +54 11 5555 0101 ",
        website_url: " Supplier.com/Catalog "
      })
    ).toEqual({
      address: resolvedAddress.address,
      contact_name: "Alex Morgan",
      email: "sales@example.com",
      google_place_id: "place-123",
      latitude: -34.6037,
      longitude: -58.3816,
      name: "Patagonia Supply",
      notes: "Delivers on Fridays.",
      phone_number: "+54 11 5555 0101",
      website_url: "https://supplier.com/Catalog"
    });
  });

  it("keeps the optional address bundle atomic", () => {
    expect(
      toSupplierInput({
        address: null,
        contact_name: "",
        email: "",
        name: "Supplier",
        notes: "",
        phone_number: "",
        website_url: ""
      })
    ).toMatchObject({
      address: null,
      google_place_id: null,
      latitude: null,
      longitude: null
    });
  });

  it("accepts only HTTP and HTTPS websites", () => {
    expect(normalizeWebsiteUrl("supplier.com")).toBe("https://supplier.com/");
    expect(normalizeWebsiteUrl("http://supplier.com/catalog")).toBe(
      "http://supplier.com/catalog"
    );
    expect(normalizeWebsiteUrl("ftp://supplier.com")).toBeNull();
    expect(normalizeWebsiteUrl("not a website")).toBeNull();
  });

  it("validates name and populated optional fields", () => {
    expect(
      supplierFormSchema.safeParse({
        address: null,
        contact_name: "",
        email: "",
        name: "Supplier",
        notes: "",
        phone_number: "",
        website_url: ""
      }).success
    ).toBe(true);
    expect(
      supplierFormSchema.safeParse({
        address: null,
        contact_name: "",
        email: "invalid",
        name: "S",
        notes: "",
        phone_number: "1",
        website_url: "ftp://supplier.com"
      }).success
    ).toBe(false);
  });

  it("builds supplier initials", () => {
    expect(getSupplierInitials("Patagonia Building Supply")).toBe("PB");
    expect(getSupplierInitials("Acme")).toBe("A");
  });

  it("normalizes filters", () => {
    expect(normalizeSupplierFilters()).toEqual({
      ownerId: null,
      query: null,
      sort: "created_desc"
    });
    expect(
      normalizeSupplierFilters({
        ownerId: " owner-1 ",
        query: "  timber ",
        sort: "name_asc"
      })
    ).toEqual({
      ownerId: "owner-1",
      query: "timber",
      sort: "name_asc"
    });
  });
});
