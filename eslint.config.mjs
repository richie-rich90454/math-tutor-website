import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import reactCompiler from "eslint-plugin-react-compiler";

// Uses @next/eslint-plugin-next + eslint-plugin-react-hooks directly (instead
// of eslint-config-next) so ESLint 10 installs with zero peer conflicts:
// eslint-config-next bundles eslint-plugin-react / jsx-a11y / import, whose
// peer ranges still cap at eslint ^9.
const eslintConfig = defineConfig([
    js.configs.recommended,
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        plugins: {
            "@next/next": nextPlugin,
            "react-hooks": reactHooks,
            "react-compiler": reactCompiler,
        },
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...reactHooks.configs.flat.recommended.rules,
            "react-compiler/react-compiler": "warn",
            "no-empty": ["error", { allowEmptyCatch: true }],
            "react-hooks/set-state-in-effect": "off",
        },
    },
    globalIgnores([".next/**", "node_modules/**", "public/**"]),
]);

export default eslintConfig;
