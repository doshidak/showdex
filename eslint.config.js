import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default tseslint.config(
  // ignore dirs
  {
    ignores: ['node_modules/', 'build/', 'dist/', 'patches/'],
  },

  // suppress warnings about disable-directives for removed/unknown rules (e.g. @typescript-eslint/indent removed in v8)
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },

  // airbnb-base (no react) via FlatCompat
  ...compat.extends('airbnb-base'),

  // typescript-eslint recommended + type-checked
  ...tseslint.configs.recommendedTypeChecked,

  // react & hooks via native flat configs (avoids legacy API issues)
  reactPlugin.configs.flat.recommended,
  reactHooksPlugin.configs.flat.recommended,

  // main TS/TSX config
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'jsx-a11y': jsxA11yPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        __DEV__: 'readonly',
        app: true,
        chrome: 'readonly',
      },
    },
    settings: {
      node: {
        tryExtensions: ['.js', '.json', '.node', '.ts'],
      },
      react: {
        version: '18',
      },
    },
    rules: {
      '@typescript-eslint/lines-between-class-members': 0,
      '@typescript-eslint/no-unsafe-argument': 0,
      '@typescript-eslint/no-unsafe-assignment': 0,
      '@typescript-eslint/no-unsafe-call': 0,
      '@typescript-eslint/no-unsafe-member-access': 0,
      '@typescript-eslint/no-unsafe-return': 0,
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          modifiers: ['const', 'global'],
          types: ['boolean'],
          leadingUnderscore: 'allowSingleOrDouble',
          trailingUnderscore: 'allowSingleOrDouble',
        },
      ],
      '@typescript-eslint/no-unnecessary-type-assertion': 0,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: false,
        }
      ],
      camelcase: 0,
      'consistent-return': 0,
      'function-call-argument-newline': 0,
      'function-paren-newline': 0,
      'guard-for-in': 0,
      'import/default': 0,
      'import/extensions': 0,
      'import/named': 0,
      'import/namespace': 0,
      'import/no-cycle': 0,
      'import/no-extraneous-dependencies': 0,
      'import/no-named-as-default-member': 0,
      'import/no-unresolved': 0,
      'import/prefer-default-export': 0,
      indent: 0,
      'jsx-a11y/label-has-associated-control': 0,
      'lines-between-class-members': 0,
      'max-len': 0,
      'new-cap': 0,
      'node/no-extraneous-import': 0,
      'node/no-missing-import': 0,
      'node/no-unsupported-features/es-syntax': 0,
      'no-await-in-loop': 0,
      'no-bitwise': 0,
      'no-cond-assign': 0,
      'no-console': 0,
      'no-continue': 0,
      'no-invalid-this': 0,
      'no-nested-ternary': 0,
      'no-param-reassign': 0,
      'no-plusplus': 0,
      'no-prototype-builtins': 0,
      'no-restricted-syntax': 0,
      'no-shadow': 0,
      'no-underscore-dangle': 0,
      'no-unused-expressions': 0,
      'no-useless-escape': 0,
      'no-void': 0,
      'object-curly-spacing': 0,
      'operator-linebreak': 0,
      'prefer-template': 0,
      quotes: 0,
      'react/display-name': 0,
      'react/forbid-foreign-prop-types': 0,
      'react/prop-types': 0,
      'react/function-component-definition': [
        2,
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/jsx-no-duplicate-props': [
        2,
        { ignoreCase: false },
      ],
      'react/jsx-one-expression-per-line': 0,
      'react/jsx-props-no-spreading': 0,
      'react/jsx-wrap-multilines': 0,
      'react/no-array-index-key': 0,
      'react/no-unescaped-entities': 0,
      'react/require-default-props': 0,
      'react/sort-comp': [
        2,
        {
          order: [
            'static-variables',
            'static-methods',
            'instance-variables',
            'lifecycle',
            'getters',
            'setters',
            'instance-methods',
            'everything-else',
            'rendering',
          ],
        },
      ],
      'react/state-in-constructor': 0,
      'react-hooks/purity': 0,
      'valid-typeof': 0,
    },
  },

  // JS files — simplified, no babel parser needed
  {
    files: ['**/*.js'],
    rules: {
      'import/default': 'error',
      'import/named': 'error',
      'import/namespace': 'error',
      indent: 0,
    },
  },
);
