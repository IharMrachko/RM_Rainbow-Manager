import vue from 'eslint-plugin-vue';
import prettierPlugin from 'eslint-plugin-prettier';
import js from '@eslint/js';
import configPrettier from 'eslint-config-prettier';
import globals from 'globals';
import parser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  configPrettier,

  // Для JS/TS файлов
  {
    files: ['**/*.{js,ts}'],
    plugins: { prettier: prettierPlugin, '@typescript-eslint': tsPlugin },
    languageOptions: {
      parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }], // запрет console.log
    },
  },

  // Для Vue SFC
  {
    files: ['**/*.vue'],
    plugins: { prettier: prettierPlugin, '@typescript-eslint': tsPlugin },
    languageOptions: {
      parserOptions: {
        parser, // @typescript-eslint/parser для <script lang="ts">
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'prettier/prettier': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }], // запрет console.log
    },
  },
];
