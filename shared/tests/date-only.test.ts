import { formatDateOnly, parseDateOnly } from "@/shared/utils/date-only";

describe("date-only values", () => {
  it("formats values for the selected locale", () => {
    expect(formatDateOnly("2026-08-01", { locale: "en-US" })).toBe(
      "Aug 1, 2026"
    );
  });

  it("accepts caller-owned formatting options", () => {
    expect(
      formatDateOnly("2026-08-01", {
        formatOptions: { day: "2-digit", month: "long" },
        locale: "en-US"
      })
    ).toBe("August 01");
  });

  it("parses values without shifting the calendar day", () => {
    const date = parseDateOnly("2026-08-01");

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(7);
    expect(date?.getDate()).toBe(1);
  });

  it("uses caller-owned fallbacks for missing or invalid values", () => {
    expect(formatDateOnly(null)).toBe("");
    expect(formatDateOnly("2026-02-31", { fallback: "Unavailable" })).toBe(
      "Unavailable"
    );
    expect(formatDateOnly("", { fallback: "Select date" })).toBe("Select date");
  });
});
