import { test, expect } from "@playwright/test";

test("home: send a message and see a reply", async ({ page }) => {
    await page.goto("/");
    const input = page.getByPlaceholder(/ask a math question/i);
    await input.fill("What is 2+2?");
    await page.getByRole("button", { name: /send message/i }).click();
    await expect(input).toHaveValue("");
});

test("home: welcome prompt buttons fill the input", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /practice addition/i }).click();
    const input = page.getByPlaceholder(/ask a math question/i);
    await expect(input).not.toHaveValue("");
});

test("home: language switcher opens and is keyboard-navigable", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /language/i });
    await trigger.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).not.toBeVisible();
    await expect(trigger).toBeFocused();
});
