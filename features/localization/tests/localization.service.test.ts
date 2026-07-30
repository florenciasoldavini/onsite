import {
  detectDeviceLanguage,
  persistLanguagePreference,
  resolveInitialLanguage
} from "@/features/localization/services/localization.service";
import {
  readLanguagePreference,
  writeLanguagePreference
} from "@/features/localization/repositories/language-preference.repository";
import { getLocales } from "expo-localization";

jest.mock(
  "@/features/localization/repositories/language-preference.repository",
  () => ({
    readLanguagePreference: jest.fn(),
    writeLanguagePreference: jest.fn()
  })
);

jest.mock("expo-localization", () => ({
  getLocales: jest.fn()
}));

describe("localization service", () => {
  beforeEach(() => {
    jest.mocked(readLanguagePreference).mockResolvedValue(null);
    jest.mocked(writeLanguagePreference).mockResolvedValue();
    jest.mocked(getLocales).mockReturnValue([
      { languageCode: "es", languageTag: "es-AR" }
    ] as ReturnType<typeof getLocales>);
  });

  it("prefers a valid stored language over the device language", async () => {
    jest.mocked(readLanguagePreference).mockResolvedValue("en");

    await expect(resolveInitialLanguage()).resolves.toEqual({
      hasExplicitPreference: true,
      language: "en"
    });
  });

  it("uses a supported device language after invalid or failed storage", async () => {
    jest.mocked(readLanguagePreference).mockResolvedValue("pt");
    jest.mocked(getLocales).mockReturnValue([
      { languageCode: "en", languageTag: "en-US" }
    ] as ReturnType<typeof getLocales>);

    await expect(resolveInitialLanguage()).resolves.toEqual({
      hasExplicitPreference: false,
      language: "en"
    });

    jest.mocked(readLanguagePreference).mockRejectedValue(
      new Error("storage unavailable")
    );
    await expect(resolveInitialLanguage()).resolves.toEqual({
      hasExplicitPreference: false,
      language: "en"
    });
  });

  it("maps unsupported or unavailable device locales to Spanish", () => {
    jest.mocked(getLocales).mockReturnValue([
      { languageCode: "pt", languageTag: "pt-BR" }
    ] as ReturnType<typeof getLocales>);
    expect(detectDeviceLanguage()).toBe("es");

    jest.mocked(getLocales).mockImplementation(() => {
      throw new Error("locale unavailable");
    });
    expect(detectDeviceLanguage()).toBe("es");
  });

  it("stops waiting for preference storage after 1.5 seconds", async () => {
    jest.useFakeTimers();
    jest.mocked(readLanguagePreference).mockReturnValue(
      new Promise(() => {})
    );

    const resolution = resolveInitialLanguage();
    await jest.advanceTimersByTimeAsync(1500);

    await expect(resolution).resolves.toEqual({
      hasExplicitPreference: false,
      language: "es"
    });
    jest.useRealTimers();
  });

  it("persists only the validated language supplied by callers", async () => {
    await persistLanguagePreference("en");
    expect(writeLanguagePreference).toHaveBeenCalledWith("en");
  });
});
