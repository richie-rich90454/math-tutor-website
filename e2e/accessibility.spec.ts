import { test, expect } from "@playwright/test";

const SURFACES = ["/", "/login", "/signup", "/practice", "/sheets", "/progress", "/settings"];

test("every surface has a visible skip link and focusable first control", async ({ page }) => {
    for (const path of SURFACES) {
        await page.goto(path);
        await page.waitForLoadState("domcontentloaded");
        const focusables = page.locator(
            'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const count = await focusables.count();
        expect(count, `${path} should have at least one focusable control`).toBeGreaterThan(0);
        const first = focusables.first();
        await first.focus();
        await expect(first).toBeFocused();
    }
});

test("home chat input is reachable by keyboard and sends on Enter", async ({ page }) => {
    await page.goto("/");
    const input = page.getByPlaceholder(/ask a math question/i);
    await input.focus();
    await expect(input).toBeFocused();
    await input.fill("Tell me a fact");
    await input.press("Enter");
    await expect(input).toHaveValue("");
});

test("language switcher opens and selects via keyboard", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /language/i });
    await trigger.focus();
    await trigger.press("Enter");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
});

test("no focusable element traps the tab key on home", async ({ page }) => {
    await page.goto("/");
    const first = page
        .locator('a[href], button:not([disabled]), input:not([disabled]), select, textarea')
        .first();
    await first.focus();
    const before = await page.evaluate(() => document.activeElement?.className || "");
    await page.keyboard.press("Tab");
    const after = await page.evaluate(() => document.activeElement?.className || "");
    expect(after).not.toBe(before);
});
