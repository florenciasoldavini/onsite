module.exports = {
  clearMocks: true,
  coverageProvider: "v8",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },
  preset: "jest-expo",
  restoreMocks: true,
  setupFilesAfterEnv: ["<rootDir>/tests/support/jest.setup.ts"],
  testMatch: [
    "<rootDir>/tests/**/*.test.ts?(x)",
    "<rootDir>/features/**/tests/**/*.test.ts?(x)",
    "<rootDir>/shared/tests/**/*.test.ts?(x)",
    "<rootDir>/infrastructure/tests/**/*.test.ts?(x)"
  ],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|@gluestack-ui/.*|@legendapp/.*|@react-navigation/.*|@sentry/react-native|exifr|lucide-react-native|native-base|nativewind|react-native-css-interop|react-native-svg))"
  ]
};
