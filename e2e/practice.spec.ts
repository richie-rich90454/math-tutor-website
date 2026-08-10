import { test, expect } from "@playwright/test";

test("practice: loads problems and answers", async ({ page }) => {
    await page.goto("/practice");
    await expect(page.getByRole("heading", { name: /practice/i })).toBeVisible();
    const chips = page.getByRole("button", { name: /arithmetic|algebra|geometry/i });
    await expect(chips.first()).toBeVisible();
});

test("practice: topic chips filter problems", async ({ page }) => {
    await page.goto("/practice");
    const geometry = page.getByRole("button", { name: /geometry/i });
    await geometry.click();
    await expect(geometry).toHaveClass(/is-active/);
});
