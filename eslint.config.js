// The lint the check runs: the recommended rules, JavaScript's and typescript-eslint's, on every
// .js and .ts file, which run on node: the layer's code is its build, and the modules it generates
// are strings, imported by the components, the SDK, and the sites. The browse page's module,
// browse/browse.js, runs in the browser.
// Adapted from spike-html-hosting-components (99824f7): eslint.config.js, without the layer table
// and the CSS module script rule, as the layer holds no source a consumer imports and no stylesheet.

import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const code = ["**/*.js", "**/*.ts"];

export default defineConfig([
  // The build, gitignored, which ESLint doesn't read.
  { ignores: ["dist/"] },
  { files: code, extends: [js.configs.recommended, tseslint.configs.recommended] },
  { files: code, languageOptions: { globals: globals.node } },
  { files: ["browse/**"], languageOptions: { globals: globals.browser } },
]);
