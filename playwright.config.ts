import { defineConfig, devices } from "@playwright/test";

const FRONTEND = process.env.E2E_FRONTEND || "http://localhost:3000";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 60_000,
    expect: { timeout: 15_000 },
    use: {
        baseURL: FRONTEND,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        viewport: { width: 1280, height: 800 },
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ],
    reporter: [["list"]],
});
