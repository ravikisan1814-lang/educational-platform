import { expect, test } from "@playwright/test";

/**
 * Dark/light mode behavior: toggle, persistence, system preference.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("page starts in light mode by default", async ({ page }) => {
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    )
    .toBe("rgb(246, 248, 251)"); // --bg light
});

test("toggle switches to dark mode and back", async ({ page }) => {
  const toggle = page.getByRole("button", { name: /switch to dark mode/i });

  await toggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    )
    .toBe("rgb(10, 16, 29)"); // --bg dark

  await page.getByRole("button", { name: /switch to light mode/i }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("dark mode persists after reload", async ({ page }) => {
  await page.getByRole("button", { name: /switch to dark mode/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("light mode persists after reload", async ({ page }) => {
  await page.getByRole("button", { name: /switch to dark mode/i }).click();
  await page.getByRole("button", { name: /switch to light mode/i }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("respects system dark preference when no stored choice exists", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await context.close();
});

test("dark mode also themes cards and header", async ({ page }) => {
  await page.getByRole("button", { name: /switch to dark mode/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  const header = page.locator(".site-header");
  await expect
    .poll(() => header.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe("rgb(10, 16, 29)");
});
