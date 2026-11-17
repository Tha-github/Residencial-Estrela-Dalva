import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['dist/', '.astro/', 'node_modules/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Conteúdo vem de dados; HTML cru só entra com revisão explícita.
      'astro/no-set-html-directive': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
