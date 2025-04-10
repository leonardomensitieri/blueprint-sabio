module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2020,
  },
  extends: [
    "eslint:recommended"
  ],
  rules: {
    "quotes": "off",
    "no-unused-vars": "off",
    "max-len": "off",
    "indent": "off",
    "object-curly-spacing": "off",
    "require-jsdoc": "off",
    "comma-dangle": "off",
    "no-trailing-spaces": "off",
    "eol-last": "off",
    "key-spacing": "off",
    "semi": "off"
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};