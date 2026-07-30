import { localizationResources } from "@/features/localization/i18n/resources";
import { formattingLocales } from "@/features/localization/types/language";
import { createInstance } from "i18next";

describe("i18next localization contract", () => {
  it("falls back to English for a key missing from Spanish", async () => {
    const i18n = createInstance();
    await i18n.init({
      fallbackLng: "en",
      initAsync: false,
      lng: "es",
      resources: {
        en: { test: { portfolio: "Portfolio" } },
        es: { test: {} }
      }
    });

    const translate = i18n.t as unknown as (
      key: string,
      options: { ns: string }
    ) => string;
    expect(translate("portfolio", { ns: "test" })).toBe("Portfolio");
  });

  it("keeps application resource structures identical", () => {
    expect(sortedPaths(localizationResources.es)).toEqual(
      sortedPaths(localizationResources.en)
    );
  });

  it("uses the approved regional formatting locales", () => {
    expect(formattingLocales).toEqual({
      en: "en-US",
      es: "es-AR"
    });
  });
});

function sortedPaths(value: object, prefix = ""): string[] {
  return Object.entries(value)
    .flatMap(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return child && typeof child === "object"
        ? sortedPaths(child, path)
        : [path];
    })
    .sort();
}
