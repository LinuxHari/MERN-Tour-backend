import security from "eslint-plugin-security";
import node from "eslint-plugin-node";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends(
    "eslint:recommended",
    "plugin:security/recommended-legacy",
    "plugin:node/recommended",
    "plugin:@typescript-eslint/recommended",
), {
    plugins: {
        security,
        node,
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        ecmaVersion: "latest",
        sourceType: "module",
    },

    settings: {
        "import/resolver": {
            node: {},
        },
    },

    rules: {
        indent: ["error", 2],
        quotes: ["error", "single"],
        "no-console": "error",
        "no-alert": "error",
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error",
        "no-script-url": "error",
        "no-new-wrappers": "error",
        "no-global-assign": "error",

        "node/no-unsupported-features/es-syntax": ["error", {
            ignores: ["modules"],
        }],

        "node/no-missing-import": "off",
        "node/no-missing-require": "error",
        "node/no-exports-assign": "error",
        "node/no-extraneous-import": "off",

        "node/no-mixed-requires": ["error", {
            allowCall: true,
        }],

        "node/no-new-require": "error",
        "node/no-path-concat": "error",
        "node/process-exit-as-throw": "error",
        "node/shebang": "error",
        "security/detect-buffer-noassert": "error",
        "security/detect-child-process": "error",
        "security/detect-eval-with-expression": "error",
        "security/detect-new-buffer": "error",
        "security/detect-no-csrf-before-method-override": "error",
        "security/detect-non-literal-fs-filename": "error",
        "security/detect-non-literal-regexp": "warn",
        "security/detect-non-literal-require": "error",
        "security/detect-object-injection": "error",
        "security/detect-possible-timing-attacks": "error",
        "security/detect-pseudoRandomBytes": "error",
        "security/detect-unsafe-regex": "error",
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-explicit-any": "off",
    },
}];