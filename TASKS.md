# TASKS

## Unit tests — COMPLETE (opencode, 2026-08-11)

Vitest suite added: `npm test` → **15/15 passing** (`tests/unit/access.test.ts`).
Covers the full access matrix, the "Public cannot read raw L1/2/3" requirement,
anonymous fail-closed behavior, level validation, and lock metadata helpers.

## Schema refactor — COMPLETE (opencode, 2026-08-11)

Migration `0003_profiles_educational_content.sql` renames `users`→`profiles`
(+`role`) and `contents`→`educational_content` (+`owner_contact`, and
`required_access_level`→`access_level`), recreating RLS under the new names.
**Verify on a live Supabase project** (after 0001–0003):
1. Anon/Public: `select file_url from educational_content` where
   `access_level in (1,2,3)` → must be denied (column grant + tier policy).
2. Public (level-4) user: same query → denied. `access_level = 4` rows → readable.
3. Anon: `select title, owner_contact from educational_content` → metadata visible (lock badges).
4. Owner (level-1) user: `select file_url ...` → all rows readable.

## QA/E2E — COMPLETE (opencode, 2026-08-11)

Frontend UI + Playwright E2E suite delivered. `npx playwright test` = **45/45 passing** across
desktop (1440px), tablet (768px) and mobile (Pixel 7) projects.

Coverage:
- Locked content cards display BOTH "Access it" and "Contact with owner" buttons; unlocked cards
  must not show them.
- Dark/light mode: toggle, persistence across reload, system-preference default.
- Responsive: no horizontal overflow, single-column stack on mobile vs multi-column on larger
  viewports, hamburger nav on mobile vs inline nav on desktop, layout components render everywhere.

## Backend — COMPLETE (opencode, 2026-08-11)

All commands pass locally: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
Remaining backend steps need a live Supabase project:

1. Apply migrations in order: `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_seed_categories.sql`.
2. Copy `.env.example` → `.env.local` with real values.
3. Sanity checks (SQL editor):
   - Anon: `select * from contents;` must NOT expose `body_markdown`/`file_url`.
   - New auth user auto-inserts `users` row with `access_level = 4`.
   - Set a test user to level 2 → `select id, body_markdown from contents` returns only
     `required_access_level >= 2` rows.
4. Smoke test `GET /api/contents` (locked items have `title: null` + `masked_title`),
   `GET /api/contents/[id]` (401 anon / 404 under-tier / 200 with body above-tier),
   `POST /api/ai/generate` (401 anon, 200 authenticated).

## Supabase client split + Catalog page + file_url masking — COMPLETE (opencode, 2026-08-12)

`npx playwright test` = **72/72 passing** across desktop (1440px), tablet (768px) and mobile (Pixel 7).

Deliverables:
- `lib/supabase/client.ts` — browser-side Supabase client (`createBrowserClient`).
- `lib/supabase/server.ts` — server-side Supabase client (`createServerClient`).
- `lib/supabase.ts` — backward-compatible re-export of the server client (existing imports keep working).
- `app/catalog/page.tsx` — primary catalog page at `/catalog` with an Access Tiers 1–4 legend.
- `components/ContentCard.tsx` — locked cards now mask raw `file_url` on the frontend (defense-in-depth; RLS is the real gate). Raw URLs are never rendered in the DOM.
- `components/SiteHeader.tsx` — added a "Catalog" nav link.
- `components/ContentGrid.tsx` — fallback demo data includes `file_url` to prove masking works.
- `tests/catalog-page.spec.ts` — 7 new E2E tests (shared/desktop/mobile).
- `tests/content-card.spec.ts` — 2 new E2E tests for `file_url` masking.

**Verification steps:**
1. `npx tsc --noEmit` — passes.
2. `npm run build` — passes (with `NODE_OPTIONS=--max-old-space-size=4096` on Windows).
3. `npx playwright test` — 72/72 pass.
4. Visit `/catalog` — locked cards show both "Access it" and "Contact with owner" buttons plus a masked file URL; raw `storage.example.com` URLs never appear.

## Chat page + Mistral provider + bugfixes — COMPLETE (opencode, 2026-08-12)

`npx playwright test` = **72/72 passing** across desktop/tablet/mobile.

Deliverables:
- `app/chat/page.tsx` + `components/ChatInterface.tsx` — AI chat UI at `/chat` with provider
  selector (Mistral/Gemini/Groq), message history, loading and error states.
- `lib/ai/providers/mistral.ts` — Mistral provider (`MISTRAL_API_KEY`, default model
  `mistral-large-latest`), registered in `lib/ai` registry + `lib/ai/types.ts`.
- `.env.example` — documented `MISTRAL_API_KEY`; `components/SiteHeader.tsx` — Chat nav link;
  `app/globals.css` — chat styles (light/dark).

Bugs found & fixed:
- `tests/responsive-layout.spec.ts:69` — assertion expected the old home-page hero
  ("educational content"), but `/` now permanently redirects to `/catalog` (hero:
  "Content Catalog"). Was failing on all 3 viewports; updated to match the redirect.
- `components/ChatInterface.tsx` — assistant message badges displayed the currently
  selected provider instead of the provider that generated the message (mislabeling
  after switching providers mid-conversation); each assistant message now stores its
  own `provider`. Removed emoji glyphs from provider `<option>` labels.

**Verification steps:**
1. `npx tsc --noEmit` — passes. 2. `npm run lint` — passes. 3. `npm run build` — passes.
4. `npm test` — 15/15. 5. `npx playwright test` — 72/72.

## Open follow-ups
- Content ingestion/CRUD (owner admin UI).
- Tier upgrade flow (update `users.access_level`).
- Seed demo contents with real `body_markdown`.
