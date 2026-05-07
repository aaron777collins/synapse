import { test, expect } from "@playwright/test";

test("editor loads when file is clicked", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Welcome").first().click();
  await expect(page.locator(".cm-editor")).toBeVisible();
});

test("editor content is editable", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Welcome").first().click();
  await expect(page.locator(".cm-content")).toBeVisible();
  await page.locator(".cm-content").click();
  await page.keyboard.type("test ");
  await expect(page.locator(".cm-content")).toContainText("test");
});
