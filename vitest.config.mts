import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        watch: true,
        include: ["**/__tests__/**/*.test.{ts,tsx}"],
        coverage: {
            provider: "v8",
        },
        env: {
            SESSION_SECRET: "test-secret-key-for-vitest",
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
});
