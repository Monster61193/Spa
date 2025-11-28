import js from '@eslint/js'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginJsdoc from 'eslint-plugin-jsdoc'
import tsParser from '@typescript-eslint/parser'

export default js.configs.recommended({
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: ['tsconfig.json'],
      tsconfigRootDir: __dirname
    }
  },
  plugins: {
    react: pluginReact,
    'react-hooks': pluginReactHooks,
    jsdoc: pluginJsdoc
  },
  rules: {
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'default', format: null },
      { selector: 'variableLike', format: ['snake_case', 'UPPER_CASE'] },
      {
        selector: 'function',
        format: ['snake_case'],
        filter: { regex: '^use[A-Z].*', match: false }
      },
      {
        selector: 'function',
        format: ['camelCase'],
        filter: { regex: '^use[A-Z].*', match: true }
      },
      { selector: 'typeLike', format: ['PascalCase'] }
    ],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'jsdoc/require-jsdoc': [
      'error',
      {
        contexts: ['FunctionDeclaration', 'ArrowFunctionExpression', 'MethodDefinition'],
        require: {
          ArrowFunctionExpression: true,
          FunctionDeclaration: true,
          MethodDefinition: true
        }
      }
    ]
  }
})
