// @ts-check
import { baseConfig } from '../eslint.config.base.mjs';

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.typecheck.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // supertest's `response.body` is typed `any` (it can't know the shape
    // of whatever JSON the server returned), which makes every assertion
    // against it trip the type-aware unsafe-* rules. That's expected/
    // accepted friction in test code, not a real safety issue — relaxed
    // here rather than littering every test with per-line disables.
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
];
