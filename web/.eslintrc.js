module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  plugins: [
    'react',
    '@typescript-eslint',
    'prettier',
    'import',
    'simple-import-sort',
    'unused-imports',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'prettier/prettier': ['error'],
    'react/react-in-jsx-scope': ['off'],
    '@typescript-eslint/explicit-module-boundary-types': ['off'],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/prefer-namespace-keyword': ['off'],
    '@typescript-eslint/no-namespace': ['off'],
    '@typescript-eslint/restrict-template-expressions': ['off'],
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
      },
    ],
    'array-bracket-spacing': ['error', 'never'],
    'arrow-spacing': ['error'],
    'block-scoped-var': ['error'],
    'block-spacing': ['error'],
    'brace-style': ['error', '1tbs'],
    'comma-spacing': ['error'],
    'comma-style': ['error'],
    curly: ['error'],
    'dot-notation': ['error'],
    eqeqeq: ['error'],
    'func-call-spacing': ['off'],
    'import/no-duplicates': ['error'],
    'import/no-unresolved': ['off'],
    'import/default': ['off'],
    'import/no-named-as-default': ['off'],
    'import/no-named-as-default-member': ['off'],
    'key-spacing': ['error'],
    'keyword-spacing': ['error'],
    'linebreak-style': ['error'],
    'no-confusing-arrow': ['off'],
    'no-duplicate-imports': ['off'],
    'no-trailing-spaces': ['error'],
    'no-var': ['error'],
    'no-eval': ['error'],
    'no-extra-bind': ['error'],
    'no-implicit-globals': ['error'],
    'no-implied-eval': ['error'],
    'no-loop-func': ['error'],
    'no-multi-spaces': ['error'],
    'no-prototype-builtins': ['error'],
    'no-redeclare': ['error'],
    'no-setter-return': ['error'],
    'no-script-url': ['error'],
    'no-unused-vars': ['off'],
    'object-shorthand': ['error'],
    'one-var-declaration-per-line': ['error'],
    'arrow-body-style': ['off'],
    'prefer-arrow-callback': ['off'],
    quotes: ['error', 'single', { avoidEscape: true }],
    'quote-props': ['error', 'as-needed'],
    semi: ['error', 'always'],
    'semi-spacing': ['error'],
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // Side effect imports
          ['^\u0000(?!.*\u0000$)'],
          // React imports
          ['^react(/)?(?!.*\u0000$)'],
          // React-related deps
          ['^react-(?!.*\u0000$)'],
          // Absolute imports
          ['^[^.](?!.*\u0000$)'],
          // Relative imports
          ['^\\.(?!.*\u0000$)'],
          // Type imports
          ['\u0000$'],
        ],
      },
    ],
    'simple-import-sort/exports': ['error'],
    'space-in-parens': ['error', 'never'],
    'spaced-comment': [
      'error',
      'always',
      {
        block: { balanced: true },
      },
    ],
    'unused-imports/no-unused-imports': ['off'],
    'unused-imports/no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^_*',
        argsIgnorePattern: '^_*',
      },
    ],
  },
  overrides: [
    {
      files: ['.eslintrc.js', 'tailwind.config.js'],
      rules: {
        'no-undef': ['off'],
      },
    },
  ],
};
