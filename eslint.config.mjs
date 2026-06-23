import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    files: ['**/*.?([cm])[jt]s?(x)'],
    languageOptions: {
      parserOptions: {
        project: false,
      },
    },
  },
  {
    rules: {
      'pnpm/yaml-no-unused-catalog-item': 'off',
    },
  },
]);
