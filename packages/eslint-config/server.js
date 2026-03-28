import { baseConfig } from "./base.js";

export const serverConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: { node: true },
    },
    rules: {
      "no-process-exit": "error", // Good for Fastify/Node stability
    },
  },
];
