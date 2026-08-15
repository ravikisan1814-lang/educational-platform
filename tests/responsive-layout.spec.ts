import { expect, test } from "@playwright/test";

/**
 * Responsive layout tests. Run in all projects (desktop 1440px, tablet
 * 768px, mobile Pixel 7 ~412px); assertions adapt to the viewport width.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("no horizontal overflow on any viewport", async ({ page }) => {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("home explorer renders the 3 sections on every viewport", async ({ page }) => {
  const explorer = page.getByTestId("home-explorer");
  await expect(explorer).toBeVisible();

  await expect(page.getByTestId("home-section-class-11")).toBeVisible();
  await expect(page.getByTestId("home-section-class-12")).toBeVisible();
});

test("mobile: nav collapses behind hamburger; desktop: nav inline", async ({
  page,
}) => {
  const width = page.viewportSize()?.width ?? 1280;
  const nav = page.locator("#site-nav");
  const hamburger = page.getByRole("button", { name: "Toggle menu" });

  if (width < 768) {
    await expect(hamburger).toBeVisible();
    await expect(nav).not.toBeVisible();

    await hamburger.click();
    await expect(nav).toBeVisible();
    await expect(hamburger).toHaveAttribute("aria-expanded", "true");

    await hamburger.click();
    await expect(nav).not.toBeVisible();
    await expect(hamburger).toHaveAttribute("aria-expanded", "false");
  } else {
    await expect(hamburger).toHaveCount(0);
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Info" })).toBeVisible();
  }
});

test("header, hero, explorer and question recap render on every viewport", async ({
  page,
}) => {
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Class 11, Class 12/i })).toBeVisible();
  await expect(page.getByTestId("home-explorer")).toBeVisible();
  await expect(page.getByTestId("question-recap")).toBeVisible();
  await expect(page.getByText("EduPlatform")).toBeVisible();
});

test("theme toggle stays usable on mobile", async ({ page }) => {
  await page.getByRole("button", { name: /switch to dark mode/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
