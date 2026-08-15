import { expect, test } from "@playwright/test";

/**
 * Core requirement: locked content cards must display BOTH
 * "Access it" and "Contact with owner" buttons. The API response is mocked
 * so tests are deterministic and independent of the backend.
 */

const MOCK_CONTENTS = {
  data: [
    {
      id: "lock-1",
      category_id: "c1",
      category_slug: "class-11",
      category_name: "Class 11",
      is_locked: true,
      required_access_level: 2,
      title: null,
      description: null,
      masked_title: "Locked content (Member tier)",
      // Deliberately present to prove the frontend masks it — the raw
      // URL must never appear in the DOM.
      file_url: "https://storage.example.com/class-11/advanced-notes.pdf",
    },
    {
      id: "lock-2",
      category_id: "c2",
      category_slug: "class-12",
      category_name: "Class 12",
      is_locked: true,
      required_access_level: 3,
      title: null,
      description: null,
      masked_title: "Locked content (Co-member tier)",
      file_url: "https://storage.example.com/class-12/board-papers.pdf",
    },
    {
      id: "open-1",
      category_id: "c3",
      category_slug: "general-knowledge",
      category_name: "General Knowledge",
      is_locked: false,
      required_access_level: 4,
      title: "Free GK samples",
      description: "Open sample questions for everyone.",
      masked_title: null,
    },
    {
      id: "open-2",
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
      body: JSON.stringify(MOCK_CONTENTS),
    })
  );
  await page.goto("/catalog");
});

test("locked cards display both 'Access it' and 'Contact with owner' buttons", async ({
  page,
}) => {
  const lockedCards = page.getByTestId("content-card-locked");
  await expect(lockedCards).toHaveCount(2);

  for (let i = 0; i < (await lockedCards.count()); i++) {
    const card = lockedCards.nth(i);
    await expect(
      card.getByRole("link", { name: "Access it" })
    ).toBeVisible();
    await expect(
      card.getByRole("link", { name: "Contact with owner" })
    ).toBeVisible();
  }
});

test("locked cards do not expose the real title or a 'Read' link", async ({
  page,
}) => {
  const card = page.getByTestId("content-card-locked").first();
  await expect(card).toBeVisible();

  await expect(card.getByRole("heading", { name: /Locked content/ })).toBeVisible();
  await expect(card.getByRole("link", { name: "Read" })).toHaveCount(0);
});

test("unlocked cards do not show 'Access it' or 'Contact with owner'", async ({
  page,
}) => {
  const unlockedCards = page.getByTestId("content-card-unlocked");
  await expect(unlockedCards).toHaveCount(2);

  const card = unlockedCards.first();
  await expect(card.getByRole("link", { name: "Read" })).toBeVisible();
  await expect(card.getByRole("link", { name: "Access it" })).toHaveCount(0);
  await expect(
    card.getByRole("link", { name: "Contact with owner" })
  ).toHaveCount(0);
});

test("'Access it' and 'Contact with owner' are mailto links to the owner", async ({
  page,
}) => {
  const card = page.getByTestId("content-card-locked").first();
  await expect(card).toBeVisible();

  const accessIt = card.getByRole("link", { name: "Access it" });
  await expect(accessIt).toHaveAttribute("href", /^mailto:/);

  const contact = card.getByRole("link", { name: "Contact with owner" });
  await expect(contact).toHaveAttribute("href", /^mailto:/);
});

test("locked cards mask the raw file_url and never expose it in the DOM", async ({
  page,
}) => {
  const lockedCards = page.getByTestId("content-card-locked");
  await expect(lockedCards).toHaveCount(2);

  for (let i = 0; i < (await lockedCards.count()); i++) {
    const card = lockedCards.nth(i);
    await expect(card.locator("[data-testid='masked-file-url']")).toBeVisible();

    const masked = await card
      .locator("[data-testid='masked-file-url']")
      .textContent();
    expect(masked).toContain("Content URL hidden");
    expect(masked).not.toContain("storage.example.com");
    expect(masked).not.toContain("https://");
  }

  // Raw URLs must not appear anywhere on the page
  await expect(page.getByText("storage.example.com")).toHaveCount(0);
});

test("unlocked cards never show a masked file URL", async ({ page }) => {
  const unlockedCards = page.getByTestId("content-card-unlocked");
  await expect(unlockedCards).toHaveCount(2);

  for (let i = 0; i < (await unlockedCards.count()); i++) {
    const card = unlockedCards.nth(i);
    await expect(card.locator("[data-testid='masked-file-url']")).toHaveCount(0);
  }
});
