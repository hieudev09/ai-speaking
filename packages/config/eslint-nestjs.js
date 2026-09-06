/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve('./eslint-base')],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
