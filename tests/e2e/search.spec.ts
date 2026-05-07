import { test, expect } from "@playwright/test";

test("quick switcher opens on Ctrl+K", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const input = page.getByPlaceholder("Jump to note");
  await expect(input).toBeVisible();
  await input.press("Escape");
  await expect(input).not.toBeVisible({ timeout: 3000 });
});
