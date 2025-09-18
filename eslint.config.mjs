import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import prettierPlugin from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
    // Базовые правила JS
    js.configs.recommended,

    // Рекомендованные правила Vue 3 (flat config)
    ...vue.configs['flat/recommended'],

    // Отключаем конфликтующие правила ESLint (Prettier)
    configPrettier,

    // Включаем плагин Prettier как правило ESLint
    {
        files: ['**/*.{js,vue}'],
        plugins: { prettier: prettierPlugin },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            'prettier/prettier': 'error' // ошибки форматирования будут видны в ESLint
        },
    },
];
