const globals = require('globals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'reports/**',
      'cypress/screenshots/**',
      'cypress/videos/**'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.browser,
        cy: 'readonly',
        Cypress: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        beforeEach: 'readonly',
        after: 'readonly',
        afterEach: 'readonly'
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-constant-binary-expression': 'error'
    }
  }
];
