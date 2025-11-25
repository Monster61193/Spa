// ESLint base (naming + hooks + JSDoc)
import js from '@eslint/js'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginJsdoc from 'eslint-plugin-jsdoc'
import tseslint from 'typescript-eslint'
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { project: ['./tsconfig.json'], tsconfigRootDir: process.cwd() } },
    plugins: { react: pluginReact, 'react-hooks': pluginReactHooks, jsdoc: pluginJsdoc },
    rules: {
      'jsdoc/require-jsdoc': ['error', { contexts: ['FunctionDeclaration','ArrowFunctionExpression'] }],
      'react-hooks/rules-of-hooks': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'variableLike', format: ['snake_case','UPPER_CASE'] },
        { selector: 'function', format: ['snake_case'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'function', filter: { regex: '^use[A-Z]', match: true }, format: ['camelCase'] }
      ]
    }
  }
)
