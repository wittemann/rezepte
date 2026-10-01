// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/', '.vercel/', '.astro/', 'coverage/', 'design/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  { rules: { '@typescript-eslint/consistent-type-definitions': ['error', 'type'] } },
  { languageOptions: { globals: { ...globals.node } } },
);
