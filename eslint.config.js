import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    ignores: ['dist', 'node_modules'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
        es6: true,
      },
      sourceType: 'module',
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: {
          paths: ['src'],
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      // Prettier Formatting Rules (based on Airbnb)
      'prettier/prettier': [
        'warn',
        {
          arrowParens: 'always',
          bracketSpacing: true,
          jsxBracketSameLine: false,
          jsxSingleQuote: false,
          printWidth: 100,
          proseWrap: 'always',
          quoteProps: 'as-needed',
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
          useTabs: false,
          endOfLine: 'auto',
        },
      ],

      // Import Rules
      'import/no-extraneous-dependencies': ['warn', { devDependencies: true }],
      'import/no-unresolved': 'off', // raw-loader

      // React Rules
      'react/jsx-filename-extension': ['warn', { extensions: ['.js', '.jsx'] }],
      'react/jsx-no-target-blank': 'off',
      'react/no-array-index-key': 'off',
      'react/no-unescaped-entities': 'off',
      'react/destructuring-assignment': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/state-in-constructor': 'off',
      'react/no-danger': 'off',
      'react/prop-types': 'off',
      'react/forbid-prop-types': 'off',
      'react/require-default-props': 'off',
      'react/default-props-match-prop-types': 'off',
      'react/no-unused-prop-types': 'off',
      'react/react-in-jsx-scope': 'off', // React 17+
      'react/jsx-uses-react': 'off', // React 17+
      'react/jsx-no-bind': 'off',

      // React Refresh (for Vite HMR)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // General Rules
      'no-unused-vars': 'off',
      'no-console': 'off',
      'no-use-before-define': 'off',
      'no-underscore-dangle': 'off',
      'no-param-reassign': 'off', // Redux Toolkit state mutations
      'global-require': 'off', // raw-loader

      // Unused Imports Plugin
      'unused-imports/no-unused-imports': 'warn',
    },
  },
];
