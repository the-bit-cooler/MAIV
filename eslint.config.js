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
          groups: ['builtin', 'external', 'internal'],

          pathGroups: [
            // ⚛️ React ecosystem (react, react-native, @react*)
            {
              pattern: '{react,react-native,react-native-*,react-native-*/**,@react*/**}',
              group: 'builtin',
              position: 'before',
            },
            // 🧩 Expo ecosystem (scoped + unscoped)
            {
              pattern: '{@expo/**,expo*,expo-*/**}',
              group: 'external',
              position: 'before',
            },
            // 📦 Other external packages (e.g., lodash, date-fns, axios)
            {
              pattern: '{@*,[a-zA-Z]*,[a-zA-Z]*/*}',
              group: 'external',
              position: 'after',
            },
            // 🏠 Internal project imports
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
