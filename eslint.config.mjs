import nextConfig from "eslint-config-next";
import { fixupPluginRules } from "@eslint/compat";

const eslintConfig = nextConfig.map((config) => {
    if (config.plugins) {
        const fixed = {};
        for (const [name, plugin] of Object.entries(config.plugins)) {
            fixed[name] = fixupPluginRules(plugin);
        }
        return { ...config, plugins: fixed };
    }
    return config;
});

eslintConfig.push({
    ignores: [".next/**", "node_modules/**", "public/**"],
});

export default eslintConfig;