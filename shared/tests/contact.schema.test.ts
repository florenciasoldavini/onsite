import {
  optionalEmailSchema,
  optionalPhoneSchema,
  personContactFormSchema,
  personContactRecordSchema
} from "@/shared/schemas/contact";

describe("contact schema", () => {
  it("validates optional email and phone fields consistently", () => {
    expect(optionalEmailSchema.safeParse("").success).toBe(true);
    expect(optionalEmailSchema.safeParse("PERSON@EXAMPLE.COM").success).toBe(
      true
    );
    expect(optionalEmailSchema.safeParse("invalid").success).toBe(false);
    expect(optionalPhoneSchema.safeParse("").success).toBe(true);
    expect(optionalPhoneSchema.safeParse("+54 11 5555 0101").success).toBe(
      true
    );
    expect(optionalPhoneSchema.safeParse("1").success).toBe(false);
  });

  it("validates person contact forms and persisted records", () => {
    expect(
      personContactFormSchema.safeParse({
        email: "",
        first_name: "Alex",
        last_name: "",
        phone_number: ""
      }).success
    ).toBe(true);
    expect(
      personContactRecordSchema.safeParse({
        created_at: "2026-07-28T10:00:00.000Z",
        deleted_at: null,
        email: null,
        first_name: "Alex",
        id: "person-1",
        last_name: null,
        owner_id: "owner-1",
        phone_number: null,
        updated_at: null
      }).success
    ).toBe(true);
  });
});
