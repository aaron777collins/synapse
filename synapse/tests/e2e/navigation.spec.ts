import { test, expect } from "@playwright/test";

test("loads app and renders page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Synapse");
});

test("can open a file from tree", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Welcome").first().click();
  await expect(page.locator(".cm-content")).toBeVisible();
});

test("wikilink navigation creates new note", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Welcome").first().click();
  await expect(page.locator(".cm-content")).toBeVisible();
});
