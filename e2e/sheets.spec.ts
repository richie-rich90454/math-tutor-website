import { test, expect } from "@playwright/test";

test("sheets: renders formula sheet for a topic", async ({ page }) => {
    await page.goto("/sheets");
    await expect(page.getByRole("heading", { name: /sheets/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /algebra|geometry/i }).first()).toBeVisible();
});

test("sheets: topic chips switch active sheet", async ({ page }) => {
    await page.goto("/sheets");
    const calculus = page.getByRole("button", { name: /calculus/i });
    await calculus.click();
    await expect(calculus).toHaveClass(/chip-active|is-active/);
});
