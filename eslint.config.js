import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // A provider next to its hook, a component next to its imperative
      // trigger (toast) or its class recipe (buttonVariants), are kept
      // together on purpose; fast refresh still works for the components.
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['useAuth', 'useTheme', 'toast', 'buttonVariants'] },
      ],
    },
  },
])
