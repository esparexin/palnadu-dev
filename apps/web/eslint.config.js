const nextPlugin = require('@next/eslint-plugin-next');
const tseslint = require('typescript-eslint');

/**
 * ESLint flat config for the web app (ESLint 9).
 *
 * Replaces `next lint`, which is deprecated in Next 15 and prompted
 * interactively to create a config, exiting non-zero under automation.
 *
 * `@next/eslint-plugin-next` still ships eslintrc-style configs, so its rules are
 * registered directly rather than via `extends`.
 */
module.exports = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    languageOptions: {
      // TypeScript sources need the TS parser; a default espree parser fails on
      // `interface` and generics.
      ...(tseslint.parser
        ? { parser: tseslint.parser }
        : {}),
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Recommended Next.js rules: correctness issues (image optimisation,
      // client/server boundary mistakes, invalid <Link> usage).
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      // Style-level findings stay warnings so the gate is actionable.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];