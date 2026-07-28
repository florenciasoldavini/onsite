import "@testing-library/react-native";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default
);

jest.mock("nativewind", () => {
  const actual = jest.requireActual("nativewind");

  return {
    ...actual,
    useColorScheme: () => ({
      colorScheme: "light",
      setColorScheme: jest.fn(),
      toggleColorScheme: jest.fn()
    })
  };
});
