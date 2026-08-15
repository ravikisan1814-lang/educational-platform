import { expect, test } from "@playwright/test";

/**
 * Responsive layout tests. Run in all projects (desktop 1440px, tablet
 * 768px, mobile Pixel 7 ~412px); assertions adapt to the viewport width.
 */

/**
 * Mocked here to be deterministic and independent of the backend (the
 * live educational_content table is empty, and the demo fallback only
 * triggers on a fetch error, not on a 200 with an empty list).
 */
const MOCK_CONTENTS = [
  {
    id: "mock-locked-1",
    category_id: "c1",
    category_slug: "class-11",
    category_name: "Class 11",
    is_locked: true,
    required_access_level: 2,
    title: null,
    description: null,
    masked_title: "Locked content (Member tier)",
    owner_contact: null,
    file_url: "https://storage.example.com/class-11/advanced-notes.pdf",
  },
  {
    id: "mock-locked-2",
    category_id: "c2",
    category_slug: "class-12",
    category_name: "Class 12",
    is_locked: true,
    required_access_level: 3,
    title: null,
    description: null,
    masked_title: "Locked content (Co-member tier)",
    owner_contact: null,
    file_url: "https://storage.example.com/class-12/board-papers.pdf",
  },
  {
    id: "mock-open-1",
    category_id: "c3",
    category_slug: "general-knowledge",
    category_name: "General Knowledge",
    is_locked: false,
    required_access_level: 4,
    title: "Free GK samples",
    description: "Open sample questions for everyone.",
    masked_title: null,
    owner_contact: null,
  },
  {
    id: "mock-open-2",
    category_id: "c4",
    category_slug: "loksewa-knowledge",
    category_name: "Loksewa Knowledge",
    is_locked: false,
    required_access_level: 4,
    title: "Loksewa basics",
    description: "Introductory material, publicly available.",
    masked_title: null,
    owner_contact: null,
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/contents", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: MOCK_CONTENTS }),
    });
  });
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
  await page.goto("/catalog");
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
    await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
  }
});

test("header, hero, grid and footer render on every viewport", async ({
  page,
}) => {
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /class 11/i }).first()
  ).toBeVisible();
  await expect(page.locator(".home-dashboard")).toBeVisible();
  await expect(page.locator(".site-footer")).toBeVisible();
  await expect(page.getByText("Ravikisan's Platform").first()).toBeVisible();
});

test("theme toggle stays usable on mobile", async ({ page }) => {
  await page.getByRole("button", { name: /switch to dark mode/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
