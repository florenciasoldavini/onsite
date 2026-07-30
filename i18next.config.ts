import { defineConfig } from "i18next-cli";

export default defineConfig({
  locales: ["en", "es"],
  extract: {
    defaultNS: false,
    ignore: [
      "**/*.d.ts",
      "**/*.test.{ts,tsx}",
      "**/tests/**",
      "**/i18n/**",
      "features/projects/utils/project-form-values.ts",
      "shared/ui/primitives/**"
    ],
    input: ["app/**/*.{ts,tsx}", "features/**/*.{ts,tsx}", "shared/**/*.{ts,tsx}"],
    output: "{{namespace}}/i18n/{{language}}.ts",
    outputFormat: "ts",
    primaryLanguage: "en",
    secondaryLanguages: ["es"],
    sort: true,
    // Feature resources are contracts and some keys are reached through typed
    // maps rather than selector expressions.
    removeUnusedKeys: false,
    extractFromComments: false
  },
  lint: {
    checkInterpolationParams: true,
    ignoredAttributes: [
      "className",
      "data-testid",
      "href",
      "key",
      "name",
      "routeName",
      "testID",
      "value"
    ],
    ignore: [
      "**/*.test.{ts,tsx}",
      "**/tests/**",
      "**/i18n/**",
      "**/types/**",
      "shared/ui/primitives/**"
    ]
  },
  types: {
    enableSelector: "strict",
    input: ["features/**/i18n/en.ts", "shared/i18n/en.ts"],
    output: "features/localization/i18n/generated.d.ts"
  }
});
