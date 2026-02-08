module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "web", // apps/web
        "contract: eth", // contracts/ethereum
        "contract: base", // contracts/base
        "contract: sol", // contracts/solana
        "all", // cross-cutting changes
      ],
    ],
  },
};
