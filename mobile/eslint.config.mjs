// @ts-check
import reactNativeConfig from '@react-native/eslint-config/flat';

/**
 * Uses React Native's official flat config (ESLint 9) rather than our
 * shared eslint.config.base.mjs — RN's config already encodes the correct
 * parser/plugins/globals for this environment (React Native globals, JSX,
 * Metro's Babel setup) and duplicating that from the generic base config
 * would be redundant and risk drifting out of sync with the RN version.
 *
 * The Flow-annotation block (eslint-plugin-ft-flow) is dropped: this app is
 * TypeScript-only (no Flow), and that plugin currently crashes under this
 * ESLint version when linting plain .js config files (babel.config.js etc.)
 * — see https://github.com/facebook/react-native/ (eslint-plugin-ft-flow /
 * ESLint 9 compatibility). Those files still get the base + RN rule blocks.
 */
const reactNativeConfigWithoutFlow = reactNativeConfig.filter(
  config => !(config.plugins && 'ft-flow' in config.plugins),
);

export default [
  ...reactNativeConfigWithoutFlow,
  {
    ignores: ['ios/**', 'android/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
];
