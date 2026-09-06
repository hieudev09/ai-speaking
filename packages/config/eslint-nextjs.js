/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve('./eslint-base'), 'next/core-web-vitals'],
  rules: {
    'no-console': 'warn',
  },
};
