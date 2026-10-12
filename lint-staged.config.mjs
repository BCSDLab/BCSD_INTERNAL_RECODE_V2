export default {
  '*.{ts,tsx,js,jsx,mjs,mts}': ['oxfmt --write', 'oxlint --fix --deny-warnings'],
  '*.{json,jsonc,md,yml,yaml,css,html}': 'oxfmt --write',
};
