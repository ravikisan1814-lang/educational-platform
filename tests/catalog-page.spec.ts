import { expect, test } from "@playwright/test";

/**
 * Catalog page E2E test.
 *
 * Requires the contents API to be reachable OR falls back to demo data in
 * ContentGrid. Mocked here to be deterministic and independent of the backend.
 * Runs in all Playwright projects (desktop 1440px, tablet 768px, mobile Pixel 7).
 */

const MOCK_CATALOG = {
  data: [
    // Tier 1 (Owner) — unlocked for everyone? No: public user (4) is BELOW
    // owner (1), so owner-level content is locked for a public user.
    {
      id: "tier1-owner",
      category_id: "c1",
      category_slug: "class-11",
      category_name: "Class 11",
      is_locked: true,
      required_access_level: 1,
      title: null,
      description: null,
      masked_title: "Locked content (Owner tier)",
      file_url: "https://storage.example.com/owner/secret.pdf",
    },
    // Tier 2 (Member)
    {
      id: "tier2-member",
      category_id: "c2",
      category_slug: "class-12",
      category_name: "Class 12",
      is_locked: true,
      required_access_level: 2,
      title: null,
      description: null,
      masked_title: "Locked content (Member tier)",
      file_url: "https://storage.example.com/member/advanced.pdf",
    },
    // Tier 3 (Co-member)
    {
      id: "tier3-co-member",
      category_id: "c3",
      category_slug: "general-knowledge",
      category_name: "General Knowledge",
      is_locked: true,
      required_access_level: 3,
      title: null,
      description: null,
      masked_title: "Locked content (Co-member tier)",
      file_url: "https://storage.example.com/co-member/premium.pdf",
    },
    // Tier 4 (Public) — unlocked
    {
      id: "tier4-public",
      category_id: "c4",
      category_slug: "loksewa-knowledge",
      category_name: "Loksewa Knowledge",
      is_locked: false,
      required_access_level: 4,
      title: "Loksewa basics",
      description: "Introductory material, publicly available.",
      masked_title: null,
    },
  ],
  user_access_level: 4,
  access_level_label: "Public",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/contents", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_CATALOG),
    })
  );
});

test.describe("Catalog page — shared", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/catalog");
  });

  test("renders the catalog hero without exposing internal access tiers", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Content Catalog" })
    ).toBeVisible();

    // Internal access tiers (Owner/Member/Co-member/Public) are not shown
    // to external users. Exact match: masked card titles legitimately contain
    // tier words ("Locked content (Owner tier)"), so substring matching would
    // false-positive against them and the "Contact owner" CTA.
    await expect(page.locator(".tier-legend")).toHaveCount(0);
    for (const label of ["Owner", "Member", "Co-member", "Public"]) {
      await expect(page.getByText(label, { exact: true })).toHaveCount(0);
    }
  });

  test("shows one locked card per premium tier and one unlocked card", async ({
    page,
  }) => {
    const locked = page.getByTestId("content-card-locked");
    await expect(locked).toHaveCount(3);

    const unlocked = page.getByTestId("content-card-unlocked");
    await expect(unlocked).toHaveCount(1);
  });

  test("all locked cards show both action buttons and a masked file URL", async ({
    page,
  }) => {
    const locked = page.getByTestId("content-card-locked");
    await expect(locked).toHaveCount(3);

    for (let i = 0; i < (await locked.count()); i++) {
      const card = locked.nth(i);
      await expect(
        card.getByTestId("access-it-button")
      ).toBeVisible();
      await expect(
        card.getByTestId("contact-owner-button")
      ).toBeVisible();
      await expect(card.getByTestId("masked-file-url")).toBeVisible();
    }
  });

  test("raw file URLs never appear on the catalog page", async ({ page }) => {
    await expect(page.getByText("storage.example.com")).toHaveCount(0);
    await expect(page.getByText("https://")).toHaveCount(0);
  });
});

test.describe("Catalog page — desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("grid uses multiple columns on desktop", async ({ page }) => {
    await page.goto("/catalog");
    const cards = page.locator("[data-testid^='content-card']");
    await expect(cards.first()).toBeVisible();

    const distinctX = await cards.evaluateAll((els) => {
      const xs = new Set(
        els.map((el) => Math.round(el.getBoundingClientRect().x))
      );
      return xs.size;
    });
    expect(distinctX).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Catalog page — mobile", () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test("grid stacks in a single column on mobile", async ({ page }) => {
    await page.goto("/catalog");
    const cards = page.locator("[data-testid^='content-card']");
    await expect(cards.first()).toBeVisible();

    const distinctX = await cards.evaluateAll((els) => {
      const xs = new Set(
        els.map((el) => Math.round(el.getBoundingClientRect().x))
      );
      return xs.size;
    });
    expect(distinctX).toBe(1);
  });

  test("no horizontal scroll on mobile with locked cards", async ({ page }) => {
    await page.goto("/catalog");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});