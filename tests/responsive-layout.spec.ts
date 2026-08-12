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

test("content grid adapts column count to viewport width", async ({ page }) => {
  const width = page.viewportSize()?.width ?? 1280;
  const cards = page.locator("[data-testid^='content-card']");
  await expect(cards.first()).toBeVisible();

  const distinctColumnCount = () =>
    cards.evaluateAll(
      (els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().x))).size
    );

  if (width < 768) {
    // mobile: single column stack — every card starts at the same x
    await expect.poll(distinctColumnCount).toBe(1);
  } else {
    // tablet/desktop: multi-column — cards occupy at least two x positions
    await expect.poll(distinctColumnCount).toBeGreaterThanOrEqual(2);
  }
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
    await expect(nav.getByRole("link", { name: "Contents" })).toBeVisible();
  }
});

test("header, hero, grid and footer render on every viewport", async ({
  page,
}) => {
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.getByRole("heading", { name: /content catalog/i })).toBeVisible();
  await expect(page.locator(".content-section").first()).toBeVisible();
  await expect(page.locator(".site-footer")).toBeVisible();
  await expect(page.getByText("EduPlatform")).toBeVisible();
});

test("theme toggle stays usable on mobile", async ({ page }) => {
  await page.getByRole("button", { name: /switch to dark mode/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
