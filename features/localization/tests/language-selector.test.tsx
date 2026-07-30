import { LanguageSelector } from "@/features/localization/components/language-selector";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent } from "@testing-library/react-native";

describe("LanguageSelector", () => {
  it("announces the active language and switches immediately", async () => {
    const view = await renderWithAppProviders(<LanguageSelector />, {
      language: "en"
    });

    expect(
      view.getByLabelText("App language, currently English")
    ).toBeOnTheScreen();

    await fireEvent.press(
      view.getByLabelText("App language, currently English")
    );
    await fireEvent.press(view.getByText("Español"));

    expect(
      view.getByLabelText("Idioma de la aplicación: Español")
    ).toBeOnTheScreen();
  });
});
