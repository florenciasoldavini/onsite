import DirectoryScreen from "@/features/directory/screens/directory-screen";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { renderWithAppProviders } from "@/tests/support/render";
import { userEvent } from "@testing-library/react-native";
import type { ReactNode } from "react";

const mockPush = jest.fn();
const mockSetParams = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    setParams: mockSetParams
  })
}));

jest.mock("@/shared/hooks/use-layout-mode", () => ({
  useLayoutMode: jest.fn()
}));

jest.mock("@/features/clients/screens/clients-screen", () => {
  const React = jest.requireActual("react");
  const { Text, View } = jest.requireActual("react-native");

  return function MockClientsScreen({
    directoryHeader
  }: {
    directoryHeader: ReactNode;
  }) {
    return React.createElement(
      View,
      null,
      directoryHeader,
      React.createElement(Text, null, "clients-content")
    );
  };
});

jest.mock("@/features/contractors/screens/contractors-screen", () => {
  const React = jest.requireActual("react");
  const { Text, View } = jest.requireActual("react-native");

  return function MockContractorsScreen({
    directoryHeader
  }: {
    directoryHeader: ReactNode;
  }) {
    return React.createElement(
      View,
      null,
      directoryHeader,
      React.createElement(Text, null, "contractors-content")
    );
  };
});

jest.mock("@/features/workers/screens/workers-screen", () => {
  const React = jest.requireActual("react");
  const { Text, View } = jest.requireActual("react-native");

  return function MockWorkersScreen({
    directoryHeader
  }: {
    directoryHeader: ReactNode;
  }) {
    return React.createElement(
      View,
      null,
      directoryHeader,
      React.createElement(Text, null, "workers-content")
    );
  };
});

jest.mock("@/features/suppliers/screens/suppliers-screen", () => {
  const React = jest.requireActual("react");
  const { Text, View } = jest.requireActual("react-native");

  return function MockSuppliersScreen({
    directoryHeader
  }: {
    directoryHeader: ReactNode;
  }) {
    return React.createElement(
      View,
      null,
      directoryHeader,
      React.createElement(Text, null, "suppliers-content")
    );
  };
});

function setLayout(mode: "compact" | "expanded" | "medium") {
  jest.mocked(useLayoutMode).mockReturnValue({
    height: 844,
    isCompact: mode === "compact",
    isExpanded: mode === "expanded",
    isMedium: mode === "medium",
    mode,
    width: mode === "compact" ? 390 : mode === "medium" ? 900 : 1440
  });
}

describe("DirectoryScreen", () => {
  beforeEach(() => {
    setLayout("expanded");
  });

  it("renders the requested section and routes its desktop create action", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(
      <DirectoryScreen requestedSection="workers" />
    );

    expect(view.getByText("workers-content")).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Workers" })).toBeSelected();

    await user.press(view.getByRole("button", { name: "New worker" }));

    expect(mockPush).toHaveBeenCalledWith("/workers/new");
  });

  it("updates the route params when a desktop section tab is selected", async () => {
    const user = userEvent.setup();
    const view = await renderWithAppProviders(<DirectoryScreen />);

    await user.press(view.getByRole("button", { name: "Suppliers" }));

    expect(mockSetParams).toHaveBeenCalledWith({ section: "suppliers" });
  });

  it("uses the compact selector and defaults invalid sections to clients", async () => {
    setLayout("compact");
    const view = await renderWithAppProviders(
      <DirectoryScreen requestedSection="invalid" />
    );

    expect(view.getByText("clients-content")).toBeOnTheScreen();
    expect(
      view.getByRole("button", { name: "Choose directory section" })
    ).toHaveTextContent("Directory: Clients");
    expect(
      view.queryByRole("button", { name: "New client" })
    ).not.toBeOnTheScreen();
  });
});
