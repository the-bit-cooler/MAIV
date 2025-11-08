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
      // Optional: silence false positives from import/no-unresolved
      'import/no-unresolved': [2, { ignore: ['^@/'] }],
    },
  },
]);
