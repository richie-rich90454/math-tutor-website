import { test, expect } from "@playwright/test";

test("guest mode: starts a session and lands on chat", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /try without an account/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: /send message/i })).toBeVisible();
});

test("login form validates email field", async ({ page }) => {
    await page.goto("/login");
    const email = page.getByLabel(/email/i).first();
    await email.fill("not-an-email");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(email).toBeFocused();
});
