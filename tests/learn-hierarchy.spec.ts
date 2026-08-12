import { expect, test } from "@playwright/test";

/**
 * E2E tests for the deep-learning hierarchy:
 *
 *   1. The syllabus map at /learn is open — every cover/card navigable
 *      (no card-level locks; navigation is free for everyone).
 *   2. The in-content viewer shows the 10% public teaser, and locked items
 *      show the blur overlay with [ Access it ] / [ Contact with owner ]
 *      while NEVER leaking the raw 90% payload into the DOM.
 *   3. Type 1 / Type 2 / Type 3 tabs toggle correctly.
 *
 * The /api/hierarchy and /api/content/[id] routes are mocked for
 * determinism (same pattern as the existing catalog tests).
 */

const MOCK_HIERARCHY = {
  data: [
    {
      id: "eg-academic-core",
      slug: "academic-core",
      name: "Academic Core",
      description: "NEB Class 11 & 12 core subjects.",
      sort_order: 1,
      subjects: [
        {
          id: "s-physics",
          slug: "physics",
          name: "Physics",
          description: "Mechanics, optics, heat.",
          sort_order: 1,
          chapters: [
            {
              id: "c-mechanics",
              slug: "mechanics",
              name: "Mechanics",
              description: "Vectors, kinematics.",
              sort_order: 1,
              sub_chapters: [
                {
                  id: "sc-vectors",
                  slug: "vectors",
                  name: "Vectors",
                  description: "Vector operations.",
                  sort_order: 1,
                  topics: [
                    {
                      id: "t-vector-addition",
                      slug: "vector-addition",
                      name: "Vector Addition",
                      description: "Adding vectors.",
                      sort_order: 1,
                      content_items: [
                        {
                          id: "ci-vector-addition",
                          title: "Vector Addition — Full Notes",
                          topic_id: "t-vector-addition",
                          access_level: 2,
                          owner_contact: "ravikisan1814@gmail.com",
                          public_teaser:
                            "<p>Vectors have both <strong>magnitude</strong> and <strong>direction</strong>.</p>",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  user_access_level: 4,
};

// Locked response: is_locked true, locked_payload/variants null (never leaked).
const MOCK_LOCKED_CONTENT = {
  data: {
    id: "ci-vector-addition",
    topic_id: "t-vector-addition",
    title: "Vector Addition — Full Notes",
    access_level: 2,
    owner_contact: "ravikisan1814@gmail.com",
    public_teaser:
      "<p>Vectors have both <strong>magnitude</strong> and <strong>direction</strong>.</p>",
    variant_labels: ["Type 1", "Type 2", "Type 3"],
    is_locked: true,
    locked_payload: null,
    variants: null,
  },
};

// Unlocked response for the variant-tab toggle test.
const MOCK_UNLOCKED_CONTENT = {
  data: {
    id: "ci-unlocked",
    topic_id: "t-unlocked",
    title: "Open topic — full notes",
    access_level: 4,
    owner_contact: "ravikisan1814@gmail.com",
    public_teaser: "<p>Open teaser.</p>",
    variant_labels: ["Type 1", "Type 2"],
    is_locked: false,
    locked_payload: "<h3>Type 1 notes</h3><p>Canonical full notes.</p>",
    variants: [
      {
        label: "Type 2",
        interface: "qa",
        content: "<h3>Type 2 Q&A</h3><p>Practice questions.</p>",
      },
    ],
  },
};

const VIEWER_PATH =
  "/learn/academic-core/physics/mechanics/vectors/vector-addition/ci-vector-addition";
const UNLOCKED_PATH =
  "/learn/academic-core/physics/mechanics/vectors/vector-addition/ci-unlocked";

test.describe("Syllabus map (/learn)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/hierarchy", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_HIERARCHY),
      })
    );
  });

  test("renders the explorer with open group navigation (no card lock)", async ({
    page,
  }) => {
    await page.goto("/learn");
    await expect(
      page.getByTestId("hierarchy-explorer")
    ).toBeVisible();

    // The exam group toggle is visible and expandable — covers are open.
    const groupToggle = page.getByTestId("nav-group-academic-core");
    await expect(groupToggle).toBeVisible();
    await groupToggle.getByRole("button").click();

    // Topic cards are visible with an Open topic link (cards are never locked).
    const topicCard = page.getByTestId("topic-card");
    await expect(topicCard).toBeVisible();
    await expect(topicCard.getByRole("link", { name: "Open topic" })).toBeVisible();
  });

  test("hierarchy drill-down produces a content-item URL", async ({ page }) => {
    await page.goto("/learn");
    await page.getByTestId("nav-group-academic-core").getByRole("button").click();
    const topicCard = page.getByTestId("topic-card").first();
    const href = await topicCard
      .getByRole("link", { name: "Open topic" })
      .getAttribute("href");
    expect(href).toContain("/learn/academic-core/physics/mechanics");
    expect(href).toContain("/ci-vector-addition");
  });
});

test.describe("In-content locking (topic viewer)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/content/ci-vector-addition", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_LOCKED_CONTENT),
      })
    );
  });

  test("public users see the 10% teaser but NOT the raw 90% payload", async ({
    page,
  }) => {
    await page.goto(VIEWER_PATH);

    // 10% is visible.
    const teaser = page.getByTestId("public-concept");
    await expect(teaser).toBeVisible();
    await expect(teaser).toContainText("magnitude");

    // The 90% is NOT in the DOM — no raw payload leaked.
    await expect(page.getByText("Canonical full notes")).toHaveCount(0);
    await expect(page.getByText("resultant vector")).toHaveCount(0);
  });

  test("locked items show the blur overlay with Access it + Contact with owner", async ({
    page,
  }) => {
    await page.goto(VIEWER_PATH);

    const locked = page.getByTestId("locked-section");
    await expect(locked).toBeVisible();

    await expect(locked.getByTestId("locked-access-it")).toBeVisible();
    await expect(locked.getByTestId("locked-contact-owner")).toBeVisible();
    await expect(
      locked.getByTestId("locked-contact-owner")
    ).toHaveAttribute("href", /^mailto:/);
  });

  test("variant tabs render for locked items but content stays locked", async ({
    page,
  }) => {
    await page.goto(VIEWER_PATH);

    const tabs = page.getByTestId("variant-tabs");
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole("tab")).toHaveCount(3);

    // Even after switching tabs, the 90% is not revealed.
    await tabs.getByRole("tab", { name: /Type 2/ }).click();
    await expect(page.getByTestId("locked-section")).toBeVisible();
    await expect(page.getByText("Practice questions")).toHaveCount(0);
  });
});

test.describe("Variant tab toggling (unlocked)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/content/ci-unlocked", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_UNLOCKED_CONTENT),
      })
    );
  });

  test("Type 1 / Type 2 tabs switch the visible content interface", async ({
    page,
  }) => {
    await page.goto(UNLOCKED_PATH);

    const payload = page.getByTestId("locked-payload");
    await expect(payload).toContainText("Canonical full notes");

    await page.getByTestId("variant-tabs").getByRole("tab", { name: "Type 2" }).click();
    await expect(payload).toContainText("Practice questions");
    await expect(payload).not.toContainText("Canonical full notes");
  });
});