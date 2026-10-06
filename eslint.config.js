import { fileURLToPath } from "node:url";
import { includeIgnoreFile } from "@eslint/compat";
import jsPlugin from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import { defineConfig } from "eslint/config";
import functionalPlugin from "eslint-plugin-functional";
import importPlugin from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import simpleImportSortPlugin from "eslint-plugin-simple-import-sort";
import unicornPlugin from "eslint-plugin-unicorn";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import tsPlugin from "typescript-eslint";

const gitIgnorePath = fileURLToPath(new URL(".gitignore", import.meta.url));
const devcontainerGitIgnorePath = fileURLToPath(
  new URL(".devcontainer/.gitignore", import.meta.url),
);

export default defineConfig([
  // Ignore patterns
  includeIgnoreFile(gitIgnorePath),
  includeIgnoreFile(devcontainerGitIgnorePath),
  { ignores: [".next/", "node_modules/", "public/", ".vscode/"] },

  // Base JavaScript config
  {
    name: "project/javascript-recommended",
    files: ["**/*.{js,mjs,ts,tsx}"],
    ...jsPlugin.configs.recommended,
    plugins: { functional: functionalPlugin },
    languageOptions: { globals: { process: "readonly", URL: "readonly" } },
    rules: { "no-var": "error", "functional/no-let": "error" },
  },

  // TypeScript config
  {
    name: "project/typescript-strict",
    files: ["**/*.{ts,tsx,mjs}"],
    extends: [
      ...tsPlugin.configs.strictTypeChecked,
      ...tsPlugin.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
  },

  // Disable type checking for JS files
  {
    name: "project/javascript-disable-type-check",
    files: ["**/*.{js,mjs,cjs}"],
    ...tsPlugin.configs.disableTypeChecked,
  },

  // React and Next.js config
  {
    name: "project/react-next",
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      ...reactHooksPlugin.configs["recommended-latest"].rules,
      ...jsxA11yPlugin.configs.strict.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
    settings: { react: { version: "detect" } },
  },

  // Custom plugins config
  {
    name: "project/custom-plugins",
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "simple-import-sort": simpleImportSortPlugin,
      unicorn: unicornPlugin,
      "unused-imports": unusedImportsPlugin,
      import: importPlugin,
    },
    rules: {
      // rules from unused-imports
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // rules from eslint-plugin-simple-import-sort
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            [
              // side effect imports (like CSS)
              "^\\u0000",
              // node.js builtins
              "^node:",
              "^react",
              "^next",
              // other external packages
              "^@?\\w",
              // internal absolute imports
              "^(@|~/|src/)",
              // relative imports
              "^\\.",
            ],
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      // rules to enforce consistent spacing for imports and exports
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "import" },
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "never", prev: "import", next: "import" },
        { blankLine: "always", prev: "*", next: "export" },
        { blankLine: "always", prev: "export", next: "*" },
      ],

      // enforce consistent line breaks between imports and other statements
      "import/exports-last": "error",

      // rules from eslint-plugin-unicorn
      "unicorn/better-regex": "error",
      "unicorn/catch-error-name": "error",
      "unicorn/consistent-destructuring": "error",
      "unicorn/consistent-function-scoping": "error",
      "unicorn/empty-brace-spaces": "error",
      "unicorn/explicit-length-check": "error",
      "unicorn/new-for-builtins": "error",
      "unicorn/no-array-for-each": "error",
      "unicorn/no-await-expression-member": "error",
      "unicorn/no-for-loop": "error",
      "unicorn/no-null": "error",
      "unicorn/no-unnecessary-await": "error",
      "unicorn/no-unused-properties": "error",
      "unicorn/prefer-logical-operator-over-ternary": "error",
      "unicorn/prefer-module": "error",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-set-has": "error",
      "unicorn/prefer-set-size": "error",
      "unicorn/prefer-switch": "error",
      "unicorn/prefer-ternary": "error",
      "unicorn/prevent-abbreviations": "error",
      "unicorn/throw-new-error": "error",
    },
  },
]);
