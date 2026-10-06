/**
 * @type {import("prettier").Config}
 */
const prettierConfig = {
  jsonRecursiveSort: true,
  plugins: ["prettier-plugin-sort-json"],
  experimentalTernaries: true,
  printWidth: 80,
  objectWrap: "collapse",
};

export default prettierConfig;
