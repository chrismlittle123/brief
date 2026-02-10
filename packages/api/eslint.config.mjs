import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...tseslint.configs.recommended,
  globalIgnores(["dist/**"]),
  {
    rules: {
      // Code quality limits
      "max-depth": ["error", { max: 4 }],
      "max-params": ["error", { max: 4 }],
      "max-lines-per-function": ["error", { max: 100 }],
      "max-lines": ["error", { max: 500 }],
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

      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
]);

export default eslintConfig;
