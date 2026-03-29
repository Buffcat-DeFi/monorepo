module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'web', // apps/web
        'server', // apps/server
        'apps', // changes made to all apps
        'contract: eth', // contracts/ethereum
        'contract: base', // contracts/base
        'contract: sol', // contracts/solana
        'package: contract', // packages/contract
        'package: lib', // packages/lib
        'package: types', // packages/types
        'package: tsconfig', // packages/tsconfig
        'package: eslint-config', // packages/eslint-config
        'packages', // changes made to all packages
        'all', // cross-cutting changes
      ],
    ],
  },
};
