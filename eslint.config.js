// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*'],
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
        node: {
          extensions: [
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.ios.js',
            '.ios.ts',
            '.ios.tsx',
            '.android.js',
            '.android.ts',
            '.android.tsx',
          ],
        },
      },
    },
    rules: {
      // Fix false positives for path alias
      'import/no-unresolved': [2, { ignore: ['^@/'] }],

      // Enforce consistent import ordering and grouping
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // e.g. react, react-native
            'external', // e.g. @expo, @react-navigation
            'internal', // e.g. @/hooks, @/constants
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            // ⚛️ React ecosystem (react, react-native, @react*)
            {
              pattern:
                '{react,react-dom,react-native,react-native-*, @react*/**,react-native-*/**}',
              group: 'builtin',
              position: 'before',
            },
            // 🧩 Expo ecosystem
            {
              pattern: '{@expo/**,expo*,expo-*/**}',
              group: 'external',
              position: 'after',
            },
            // 📦 Other external packages (e.g., lodash, date-fns, axios)
            {
              pattern: '**',
              group: 'external',
              position: 'after',
            },
            // 🏠 Internal project imports (@/)
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],
    },
  },
]);
