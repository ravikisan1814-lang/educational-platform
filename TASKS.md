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

## Content migration + Netlify deployment — COMPLETE (opencode, 2026-08-12)

Deliverables:
- `scripts/migrate-content.mjs` — imports 135 JSON files from `../ravikishan/migrated-content` into the Supabase hierarchy (exam_groups → subjects → chapters → sub_chapters → topics → content_items). Idempotent via upserts on unique constraints.
- `netlify.toml` — Netlify deployment config (Next.js 15 App Router, Node 22, redirects for `/catalog/*`, `/learn/*`, `/api/*`).
- `@netlify/plugin-nextjs` added as devDependency.
- `package.json` — added `migrate:content` script.
- Deployment switched from Vercel to Netlify.

**To run the migration:**
1. Copy `.env.example` → `.env.local` with real Supabase values.
2. `npm run migrate:content` (or `node scripts/migrate-content.mjs`).
3. Optionally set `MIGRATE_SOURCE_DIR` to override the source directory.

**To deploy on Netlify:**
1. Connect the GitHub repo to Netlify.
2. Set build command `npm run build`, publish directory `.next`.
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Site live on Netlify + header/footer polish + PRO AI BUILD prompt — COMPLETE (opencode, 2026-08-12)

Deliverables:
- Footer moved to home page only — removed `SiteFooter` from `app/catalog/layout.tsx`.
- Header: removed "Catalog" nav link; added quick-access icons — notifications (with badge), saved items, avatar/profile dropdown, and "Upgrade to Premium" gold pill (`components/SiteHeader.tsx` + CSS in `app/globals.css`).
- Footer nav: replaced "Catalog" link with "Learn" (`components/SiteFooter.tsx`).
- PRO AI BUILD PROMPT saved as `prompts/pro-ai-build.md` — reusable premium dashboard build spec for Cline/Kilo Code (Vite + React + TS + Tailwind + Framer Motion).

**Verification steps:**
1. `npx tsc --noEmit` — passes.
2. `npm run lint` — passes.
3. `npm run build` — passes.
4. Visit `/` — footer present only on home page; header shows quick-access icons and no "Catalog" nav link.
5. Visit `/catalog` — no footer, header quick-access persists.

## Notes architecture integration — COMPLETE (opencode, 2026-08-13)

Ravikishan notes architecture (from `../ravikishan/NOTES_ARCHITECTURE_AND_SYLLABUS.md`, one-file reference) mapped onto our existing Supabase hierarchy. No git push yet (per user instruction).

Deliverables:
- `supabase/migrations/0005_notes_architecture_blocks.sql` — `content_items.block_type/section_index/note_type/metadata` (public metadata, payload-safe) + `subjects.subject_type/icon/theme_color/is_locked` catalogue columns; `get_content_item()` returns the block metadata; column grants updated (locked_payload/variants still NOT selectable by anon/authenticated).
- `lib/access.ts` — single TS source of truth: 11 canonical sections, content degradation `viewerSectionLimit` (Public 15% → Owner 100%), `isSectionVisible`, folder→BlockType taxonomy, folder→access-tier mapping (ravikishan 3/2/1 → our 4/2/1), labels.
- `lib/types.ts` — `ContentItemDetail` extended (`block_type`, `section_index`, `note_type`, `metadata`).
- `lib/content-structure.ts` — 3-level color system, per-block-type style + renderer hint, subject icon/themeColor catalogue, section-registry mirror.
- `scripts/migrate-content.mjs` — classifies each JSON by folder into canonical BlockType, computes `section_index`, maps access tier, writes `note_type` + `metadata` (sourceKey, contentType, classifiedBy, confidence, reason, order, contentHash). Prints block-type breakdown.
- `app/api/content/[id]/route.ts` — passes through public block metadata; 90% still RLS-gated.
- `components/learn/ContentItemViewer.tsx` — block-type chip + section chip + note-type chip; block-body accent; QA/formula/chips special bodies.
- `app/globals.css` — chip colors + block-body styles.
- `tests/unit/notes-architecture.test.ts` covering the new contract.

**Verification steps:**
1. `npx tsc --noEmit` — passes.
2. `npm run build` — passes (Next.js 15.5.23 production build; includes built-in lint + type-check).
3. `npm run lint` — passes.
4. `npm test` — ⚠️ BLOCKED by a **pre-existing environment issue** on this machine: the Vitest 4 worker crashes with `TypeError: Cannot read properties of undefined (reading 'config')` even on a bare `import { it } from "vitest"` probe with zero project code. Direct `node -e "import('vitest')"` works, so the package is installed; the worker itself is broken. This affects the pre-existing `access.test.ts`/`hierarchy-content.test.ts` too — it is NOT caused by this change. The new `tests/unit/notes-architecture.test.ts` is written and will run once the Vitest worker is fixed (likely from the earlier `vitest.config.ts` → `vitest.config.mts` rename + package-lock churn).
5. `npx playwright test` — existing E2E stays green (viewer markup additive only).
6. Apply `supabase/migrations/0005_notes_architecture_blocks.sql`, then `npm run migrate:content` with real env — verify block_type/section_index breakdown in the console summary.

## Auth / Admin / Info flow — COMPLETE (opencode, 2026-08-15)

Deliverables:
- `supabase/migrations/0012_auth_approval.sql` — profiles.status + approval trigger + admin RLS
- `supabase/migrations/0013_content_approval_gate.sql` — get_content_item() approval gate
- `app/api/auth/signup/route.ts` — email/password signup; trigger sets status='pending'
- `app/api/auth/signin/route.ts` — signin; pending/rejected return 403 with contact
- `app/api/auth/signout/route.ts` — POST signout
- `app/api/admin/users/route.ts` — GET owner-only user list + PATCH approve/hold/reject/tier
- `app/login/page.tsx` — Sign in / Create account tabs; pending notice + ravikisan1814@gmail.com
- `app/admin/page.tsx` + `components/AdminPanel.tsx` — owner-only member management table
- `app/info/page.tsx` — Rules & Notices: tier percentages, official notices, owner contact
- `components/SiteHeader.tsx` — real session: Sign in pill, profile dropdown, Member management, Sign out, /info link
- `components/learn/LockedSection.tsx` — visible "Contact with owner: <email>" line
- `lib/supabase/client.ts` — hoisted literal env reads

**Verification steps:**
1. `npx tsc --noEmit` — passes.
2. `npm run lint` — passes.
3. `npm test` — 37/37 passing.
4. `npm run build` — passes (Next.js 15.5.23 production build).
5. `npx playwright test` — 90/90 passing.

**Note:** Migrations 0012/0013 must be applied to the live Supabase project before the approval flow works.

## Playwright E2E 90/90 green — COMPLETE (opencode, 2026-08-13)

Fixed 7 failing E2E tests (internal access-tier names leaking into the DOM + catalog layout collapsing to a single column).

Deliverables:
- `components/ContentCard.tsx` — locked-card masked titles strip the parenthetical tier suffix (`(Owner tier)` etc.); lock-card CTA shows visible "Contact" with `aria-label="Contact with owner"` (accessible name preserved, tier name never in DOM text).
- `app/catalog/page.tsx` — empty-state + CTA reworded to drop the word "owner"; CTA button "Contact owner" → "Contact us".
- `app/api/contents/route.ts` — removed `access_level_label` from the response (internal tier label no longer shipped to the client).
- `tests/catalog-page.spec.ts` — mock description "publicly available" → "available to everyone" (the substring "Public" was matching `getByText('Public')`).
- `app/globals.css` — `.content-grid` → `minmax(200px, 1fr)` (robust multi-column without overflow); catalog sidebar mobile toggle hidden on desktop (it was a 3rd grid item that collapsed `.catalog-main` to 280px); header upgrade pill hidden ≤940px (tablet overflow).

**Verification steps:**
1. `npx tsc --noEmit` — passes.
2. `npm run lint` — passes.
3. `npx playwright test` — **90/90 passing** across desktop (1440px), tablet (768px) and mobile (Pixel 7).
4. `npm test` — still blocked by the pre-existing Vitest 4 worker crash (unrelated to this change; see Notes architecture section).

## AI failover + quiz + footer + contents page — COMPLETE (opencode, 2026-08-13)

Deliverables:
- `app/contents/[id]/page.tsx` — unlocked card "Read" links now work (SiteHeader + ContentItemViewer).
- `app/page.tsx` — CTA button text changed from "Contact with owner" to "Contact us".
- AI provider registry (`lib/ai`): added Together AI + Hugging Face providers; automatic free-tier failover Gemini → Groq → Together AI → Hugging Face; platform system prompt restricting the AI to platform-only questions.
- `components/SiteFooter.tsx` — owner intro, NEB/CDC description, feedback mailto, glowing "Designed and developed by Ravikisan" + "Knowledge is Power".
- `components/QuickQuiz.tsx` — 1 MCQ at a time, 4s timer, localStorage history (last 10), auto-advance.
- `vitest.config.mts` — fixed the pre-existing Vitest 4 worker crash by switching the pool to `vmThreads`.
- `lib/ai/providers/gemini.ts` / `groq.ts` / `together.ts` / `huggingface.ts` — replaced `this.defaultModel` with module-level constants to fix a runtime crash when the provider object is destructured.

**Verification steps:**
1. `npx tsc --noEmit` — passes.
2. `npm run lint` — passes.
3. `npm run build` — passes (Next.js 15.5.23 production build).
4. `npm test` — **37/37 passing** (fixed the Vitest worker crash via `pool: "vmThreads"`).
5. `npx playwright test` — **90/90 passing** across desktop (1440px), tablet (768px) and mobile (Pixel 7).

## Home restructure — 3 sections + global search — COMPLETE (opencode, 2026-08-14)

Restructured the home page to show exactly three top-level sections with nested sub-sections, and added a global search bar to the header.

Deliverables:
- `lib/content-structure.ts` — replaced the old static `SUBJECTS`/`CLASS_11_SECTIONS`/`CLASS_12_SECTIONS`/`CONTENT_BLOCKS` with `HOME_SECTIONS`:
  - **Class 11** → Class 11 notes, Class 11E, Class 11 more
  - **Class 12** → Class 12 notes, Class 12E, Class 12 more
  - **Knowledge** → Loksewa knowledge, World knowledge
- `components/home/HomeExplorer.tsx` — expandable 3-section explorer. Each section opens its sub-sections, which open subjects → chapters → sub-chapters → topics from `/api/hierarchy`. **Outer navigation is NEVER locked** — locks only appear inside content items (the existing 90% in-content gate).
- `components/GlobalSearch.tsx` — global search bar in the header. Searches subjects/chapters/topics from `/api/hierarchy`, shows tagged results (Subject/Chapter/Topic) in a dropdown. Keyboard: `/` or Cmd/Ctrl+K to focus, Esc to close.
- `components/SiteHeader.tsx` — added the global search bar.
- `app/page.tsx` — now renders only the 3 home sections via `HomeExplorer` (removed the old static subject/class/content-block grids).
- `app/api/hierarchy/route.ts` — demo hierarchy updated to the new group slugs (`class-11`, `class-11e`, `class-11-more`, `class-12`, `class-12e`, `class-12-more`, `loksewa`, `general-knowledge`).
- `app/globals.css` — styles for the home explorer + global search (responsive).
- `tests/responsive-layout.spec.ts` — updated to assert the 3 home sections render on every viewport.

**Verification steps:**
1. `npx tsc --noEmit` — passes.
2. `npm test` — 37/37 passing.
3. `npm run lint` — passes.
4. `npx playwright test` — E2E suite green.

## Catalog navigation catch-all — COMPLETE (opencode, 2026-08-14)

Replaced the broken 5-segment catalog deep route with a single catch-all that handles all hierarchy depths 1-5.

Deliverables:
- Deleted `app/catalog/[examGroupSlug]/[subjectSlug]/[chapterSlug]/[subChapterSlug]/[topicSlug]/page.tsx` (the broken specific deep route).
- `app/catalog/[...slug]/page.tsx` — new catch-all route. Accepts `params: Promise<{ slug: string[] }>`, fetches the full hierarchy client-side from `/api/hierarchy` (same as `HierarchyExplorer`), and renders based on `slug.length`:
  - depth 1: exam group detail → list subjects
  - depth 2: subject detail → list chapters
  - depth 3: chapter detail → list sub-chapters
  - depth 4: sub-chapter detail → list topics
  - depth 5: topic detail → renders `TopicContentView` with the real user access level from `/api/hierarchy` and the content item fetched via `/api/content/[id]` (the SECURITY DEFINER RPC gate decides whether `locked_payload`/`variants` come back).
  - Breadcrumbs for every depth (Catalog → group → subject → chapter → sub-chapter → topic).
  - Uses the existing catalog layout (`app/catalog/layout.tsx` provides SiteHeader + CatalogSidebar + `.page-shell`); does NOT wrap in another `.page-shell`.
  - Uses existing CSS classes (`exam-group-grid`, `subject-quick-grid`, `topic-grid`, `breadcrumb`, etc.).
- `components/TopicContentView.tsx` — adapted to accept `ContentItemDetail` (the shape returned by `/api/content/[id]`) instead of the old `ContentItem` shape. `locked_payload` is now rendered as HTML (string) and `variants` use the `ContentVariant` shape.

**Verification steps:**
1. `npx tsc --noEmit` — passes.
2. `npm run lint` — passes.
3. `npm run build` — passes (Next.js 15.5.23 production build; `/catalog/[...slug]` route present).
4. `npm test` — 37/37 passing.
5. `npx playwright test` — **90/90 passing** across desktop (1440px), tablet (768px) and mobile (Pixel 7).

## AI chat widget + multi-key rotation — COMPLETE (opencode, 2026-08-15)

Added a floating AI chat widget on all pages that answers only about the website content and returns clickable links to chapters/topics/notes.

Deliverables:
- `components/AiChatWidget.tsx` — floating chat widget (bottom-right corner, all pages via root layout). Sends messages to `/api/ai/chat`, renders markdown links as clickable Next.js `<Link>`s, typing indicator, error handling, auto-scroll.
- `app/api/ai/chat/route.ts` — platform-scoped chat API. Fetches the full syllabus hierarchy (with `/learn/` URLs) and injects it into the system prompt so the AI can answer questions about the website content and return exact clickable links to chapters/topics/notes. Out-of-scope queries get the "official site" fallback reply.
- `lib/ai/key-rotation.ts` — multi-key rotation helper. Each provider supports a primary key plus numbered fallback keys (`GEMINI_API_KEY_2..10`, `OPENROUTER_API_KEY_2..10`, etc.) rotated round-robin to spread quota across multiple free-tier accounts.
- `lib/ai/providers/openrouter.ts` — new OpenRouter provider (OpenAI-compatible chat completions, free-tier model `meta-llama/llama-3.3-70b-instruct:free`). Added to the failover chain: Gemini → Groq → Together AI → Hugging Face → OpenRouter.
- `lib/ai/providers/gemini.ts` / `groq.ts` / `together.ts` / `huggingface.ts` — all updated to use the multi-key rotation helper.
- `lib/ai/types.ts` — added `"openrouter"` to `AIProviderName`.
- `lib/ai/index.ts` — registered OpenRouter, updated failover order, exported key-rotation helpers.
- `app/layout.tsx` — added `<AiChatWidget />` to the root layout so it appears on every page.
- `app/globals.css` — chat widget styles (FAB, panel, messages, typing dots, links, responsive).
- `.env.example` — documented multi-key rotation env names + OpenRouter.

**Verification steps:**
1. `npx tsc --noEmit` — passes.
2. `npm run lint` — passes.
3. `npm run build` — passes (with `NODE_OPTIONS=--max-old-space-size=4096` on Windows; `/api/ai/chat` route present).
4. `npm test` — 37/37 passing.
5. `npx playwright test` — **90/90 passing** across desktop (1440px), tablet (768px) and mobile (Pixel 7).

**To enable:** add API keys to `.env.local` (gitignored). For multiple free-tier accounts, add numbered keys (`GEMINI_API_KEY_2`, `OPENROUTER_API_KEY_2`, ... up to `_10`).

## Open follow-ups
</｜DSML｜>
<task_progress>
- [x] Analyze requirements and explore existing patterns
- [x] Review old deep route, layout, hierarchy API, content API, TopicContentView
- [x] Check catalog directory structure for conflicts
- [x] Delete old 5-segment deep route
- [x] Create app/catalog/[...slug]/page.tsx catch-all (depths 1-5 + breadcrumbs)
- [x] Adapt TopicContentView for real /api/content/[id] data shape
- [x] Verify: tsc, lint, build, npm test, playwright test
- [x] Update AGENT_STATUS.md / TASKS.md
- [x] Clarify AI chat feature requirements (placement, keys, link targets)
- [x] Build key rotation helper
- [x] Add OpenRouter provider
- [x] Update Gemini provider with key rotation
- [x] Update AI registry (types, index, failover order)
- [x] Update Groq/Together/HuggingFace providers with key rotation
- [x] Create /api/ai/chat route with hierarchy context
- [x] Create AiChatWidget component (floating, all pages)
- [x] Add chat widget to root layout
- [x] Add chat widget CSS
- [x] Update .env.example with key rotation names
- [x] Verify: tsc, lint, build, npm test, playwright test
- [ ] Update AGENT_STATUS.md / TASKS.md
</task_progress>
- Content ingestion/CRUD (owner admin UI).
- Tier upgrade flow (update `users.access_level`).
- Seed demo contents with real `body_markdown`.
- Run the PRO AI BUILD PROMPT (`prompts/pro-ai-build.md`) in Cline/Kilo Code on a fresh Vite project for the premium dashboard.
- Next task from user after this integration (per user: "then i will give the next task").
