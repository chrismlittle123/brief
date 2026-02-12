import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Code quality limits
      "max-depth": ["error", { max: 4 }],
      "max-params": ["error", { max: 4 }],
      "max-lines-per-function": ["error", { max: 50 }],
      "max-lines": ["error", { max: 400 }],
      "complexity": "error",
      "no-console": ["error", { allow: ["error", "warn"] }],

      // Best practices
      "eqeqeq": "error",
      "prefer-const": "error",
      "no-var": "error",

      // Security
      "no-eval": "error",
      "no-implied-eval": "error",

      // Bug prevention
      "array-callback-return": "error",
      "no-template-curly-in-string": "error",
      "consistent-return": "error",

      // Imports
      "import/no-cycle": "off",

      // TypeScript
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  // Relax line-length rules for test files
  {
    files: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    rules: {
      "max-lines-per-function": "off",
      "max-lines": "off",
    },
  },
]);

export default eslintConfig;
