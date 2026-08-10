import { test, expect } from "@playwright/test";

test("progress: renders stats after load", async ({ page }) => {
    await page.goto("/progress");
    await expect(page.getByRole("heading", { name: /progress/i })).toBeVisible();
    await expect(page.getByText(/conversations/i)).toBeVisible();
});

test("settings: language switcher present", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("button", { name: /language/i }).first()).toBeVisible();
});
