import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', caughtErrors: 'none' }], // Added caughtErrors: 'none'
    },
  },
  {
    files: ['server/**/*.{js,jsx}'], // Target files in the server directory
    languageOptions: {
      globals: {
        ...globals.node, // Enable Node.js global variables
      },
    },
    rules: {
      // Define specific globals if needed instead of disabling no-undef entirely
      'no-unused-vars': ['error', { argsIgnorePattern: 'next', caughtErrors: 'none' }], // Added caughtErrors: 'none'
    },
  },
])
