import { baseConfig } from "./base.js";
import nextPlugin from "eslint-config-next";

export const nextJsConfig = [
  ...baseConfig,
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];
