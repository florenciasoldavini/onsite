const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    // Deno owns typecheck, lint, and tests for Supabase Edge Functions.
    ignores: ["dist/*", "supabase/functions/**"]
  },
  {
    files: ["shared/ui/primitives/**/*"],
    rules: {
      "prettier/prettier": "off"
    }
  },
  {
    files: ["app/**/*"],
    rules: {
      "prettier/prettier": ["error", { tabWidth: 2 }]
    }
  },
  {
    files: ["features/auth/screens/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/features/auth/repositories/auth-transport.repository",
              message:
                "Auth screens must use feature hooks instead of auth transport helpers."
            },
            {
              name: "@/infrastructure/supabase/client",
              message:
                "Auth screens must use feature hooks instead of the Supabase client."
            },
            {
              name: "@supabase/supabase-js",
              message:
                "Auth screens must use feature hooks instead of the Supabase client."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["features/auth/providers/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/infrastructure/supabase/client",
              message:
                "Contexts own React state only. Access Supabase through feature services and repositories."
            }
          ],
          patterns: [
            {
              group: ["@/features/**/repositories/**"],
              message:
                "Contexts must call feature services instead of repositories directly."
            }
          ]
        }
      ]
    }
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/components/**",
                "@/contexts/**",
                "@/hooks/**",
                "@/lib/**",
                "@/repositories/**",
                "@/schemas/**",
                "@/screens/**",
                "@/services/**",
                "@/theme/**",
                "@/types/**"
              ],
              message:
                "Import from the owning feature, shared, or infrastructure boundary instead of a retired top-level layer."
            }
          ]
        }
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ImportDeclaration[source.value='lucide-react-native']",
          message:
            "Import app icons and icon types from @/shared/ui/icons. Only the central registry may depend on Lucide."
        },
        {
          selector:
            "ImportDeclaration[source.value^='lucide-react-native/']",
          message:
            "Import app icons and icon types from @/shared/ui/icons. Only the central registry may depend on Lucide."
        }
      ],
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          vars: "all",
          varsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    files: ["features/*/screens/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/repositories/**", "@/infrastructure/**"],
              message:
                "Screens must use feature hooks or services instead of repositories or infrastructure directly."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["features/*/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/repositories/**", "@/infrastructure/**"],
              message:
                "Feature components must use feature hooks or services instead of repositories or infrastructure directly."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/**"],
              message: "Shared code cannot depend on a product feature."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["shared/ui/icons/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": "off"
    }
  },
  {
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json"
        }
      }
    }
  }
]);
