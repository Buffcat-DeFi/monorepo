import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export const baseConfig = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier, // Always put Prettier last to disable conflicting rules
  {
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
);
