# DECISIONS

Decisions recorded in reverse chronological order.

## 2026-08-16 — Auth + approval app side (opencode)

1. **App side layered on the existing DB work**: migrations 0012 (approval flow: `profiles.status`
   pending/approved/rejected, `handle_new_user` → pending, backfill → approved; approval gate inside
   `get_content_item` + the educational_content tier policy; tier spread 10/25/50/100 across the 135
   imported items) and 0013 (public items stay open to anonymous visitors) were already written — this
   session only built the UI/API on top. No DB migration needed.
2. **Auth is Supabase email+password with cookie sessions** via `@/lib/supabase` in route handlers —
   no magic links, no client-side `signInWithPassword` (cookies belong to the server). The client only
   reads the session for the header via `@/lib/supabase/client` (RLS applies).
3. **Owner-only enforcement is layered**: the admin UI is hidden behind a server-component check
   (`access_level = 1` + approved), the API re-checks the session server-side, and the DB RLS update
   policy (`current_access_level() = 1` on `profiles`) is the hard gate that actually blocks writes.
   The route returns 403 for non-owners rather than 404 (this is an admin surface, existence is not a
   secret), unlike the content-detail 404 (anti-enumeration) choice.
4. **`/admin` redirects to `/login` when signed out** and renders "Access denied" for non-owners —
   the page URL itself is not sensitive, so no 404 discovery-masking here.
5. **Login stays visible to everyone** (the site is public; the *access* is what the owner gates):
   pendings see a notice with the owner email ("login is enabled only after the owner's approval").
6. **`LockedSection` now shows the owner email visibly** ("Contact with owner: <email>") — the mailto
   target uses the item's `owner_contact` when present, else the canonical
   `ravikisan1814@gmail.com`; the *displayed* email follows the same rule (no mismatch between what is
   shown and the mailto target).
7. **`.btn`/`.btn-primary`/`.btn-secondary` were referenced by components but never defined** in
   `globals.css` — all those buttons (locked-section CTAs, content cards) rendered with no styling.
   They are now defined in the shared section and remain theme-var driven (light + `html.dark`).
8. **Header nav lost "Pricing" (`/#upgrade`) and gained "Rules & Notices" (`/info`)** — no E2E test
   asserted the header nav links (verified before editing).
9. **`process.env[name]` dynamic reads are not inlined by Next.js in browser bundles** — found when
   the header's new `createClient()` call made the whole site render the Next error page (78/90 E2E
   red). Fixed in `lib/supabase/client.ts` by hoisting to literal `process.env.NEXT_PUBLIC_*` reads
   (statically analyzable → inlined). Rule: any env the browser must see goes through a literal key
   read; keep dynamic lookups server-side only.

## 2026-08-15 — Key rotation + grants lockdown + full content import (opencode)

1. **Secret key was in the public slot**: `.env.local` had `sb_secret_…` (SECRET) in `NEXT_PUBLIC_SUPABASE_ANON_KEY` — such values are inlined into the browser bundle on Netlify. Any visitor could have read every locked payload. Fixed by rotating the anon slot to the real publishable key and moving the secret to `SUPABASE_SERVICE_ROLE_KEY` (local only). SECURITY.md should note the posture: public bundle must only ever contain the publishable key.
2. **Blanket grants were the second hole**: the old live schema granted everything to anon/authenticated at the table level; column-level grants only take effect once the table-level grants are revoked. `0010` revokes all and re-grants exactly the canonical column sets (0003/0004/0005 semantics with REVOKE included). After it, locked_payload/variants/file_url/body_markdown and profiles are 401 for anonymous.
3. **PostgREST cache must be reloaded manually after GRANT/REVOKE**: Supabase's DDL watch trigger only fires for CREATE/ALTER/DROP, so a `notify pgrst, 'reload schema';` step is required after any pure-grant migration (educational_content appeared fixed earlier only because ALTER TABLE statements had triggered a reload).
4. **Real content is imported & public by design**: `migrate-content.mjs` (135 files) upserts everything at `access_level = 4`. All 135 topics + 135 content items now live in the hierarchy. If any content must be sold, tiers are an owner-only SQL update per row — deliberately not auto-assigned.
5. **Legacy columns are dropped, not papered over**: `topics.title` (NOT NULL, dead — app reads `name`) blocked all inserts; dropped via `0011` rather than adding a default, keeping the live schema equal to the canonical migration chain.

## 2026-08-15 — Live-DB repair + ContentGrid wiring + test fixes (opencode)

1. **Live DB was repaired instead of re-seeded**: the drift (`topics.title` instead of `name`, missing
   `sort_order`/`updated_at`/`description`/`get_content_item`/`categories`, `locked_payload` jsonb,
   duplicate rows) came from migrations 0001–0004 never being applied to a hand-built older schema.
   Fixed with idempotent migrations **0005–0008** pasted into the dashboard SQL editor — no destructive
   drops, no re-migration, safe to re-run (guarded `if not exists` / DO blocks / `on conflict do nothing`).
2. **Migrations go through the user's dashboard** (project `tsvbksfegvdjwczzfdcx`): no supabase CLI and no
   `SUPABASE_SERVICE_ROLE_KEY` locally; all verification is read-only anon REST probing (harmless) +
   in-app endpoint checks.
3. **`locked_payload` normalized to `text`** (canonical `0004` type). The jsonb→text guard checks
   `information_schema` `data_type in ('json','jsonb')` and unwraps JSON-string payloads via `#>> '{}'`.
4. **Demo fallback only fires on fetch error**: `ContentGrid` shows FALLBACK demo data only when
   `/api/contents` throws; a 200 with an empty list renders a genuinely empty grid. Hence
   `responsive-layout.spec.ts` mocks `/api/contents` in `beforeEach` — the suite must not depend on the
   live DB being populated (consistent with 2026-08-11 decision #3).
5. **Corrected a false assumption**: `/` serves the home page (hero "Master every subject with premium
   study material") — NOT a permanent redirect to `/catalog`. The footer is reachable on `/`. The
   `responsive-layout.spec` was updated to assert the home hero, and `getByText("EduPlatform")` needs
   `.first()` (strict mode).
6. **`ContentCard` masking is plain text**, `"[Content URL hidden — requires access]"` — no emoji
   (repo-wide no-emoji convention); tests assert substring `"Content URL hidden"`.
7. **Tablet header compacts at ≤1023px** (icon buttons, profile menu, Upgrade pill hidden; nav inline at
   768 as tests demand) — fixes the 137px overflow found at 768px.
8. **The fork repo squats port 3100**: before any Playwright run, kill all `node` processes and confirm
   the served page's CSS hash matches the local build, otherwise tests run against the wrong server.

## 2026-08-15 — Enhanced visuals with free MIT libs (opencode)

1. **Only free (MIT) visualization libs added**: `@microlink/react-json-view` (NOT the abandoned `react-json-view` — unmaintained since 2021), `plotly.js-dist-min` (official prebuilt bundle, 0 runtime deps), and `three`. All license-checked; nothing requires payment.
2. **Heavy engines are lazy-loaded, never part of first paint**: every engine is imported via `next/dynamic`/dynamic `import()` with `ssr:false` and only mounted after the user opens a `VizPanel`. Verified: first-load JS unchanged (~107 kB); Plotly (~4.4 MB raw / ~1.1 MB gzip) and three.js (~725 KB raw / ~200 KB gzip) arrive on demand. JSON viewer chunk ~116 KB.
3. **Plotly used without `react-plotly.js`**: that wrapper's peer range predates React 19; a ~40-line wrapper component around `plotly.js-dist-min` (newPlot/purge lifecycle) avoids the peer-dep conflict and keeps types via `@types/plotly.js-dist-min`.
4. **JSON inspection never becomes a leak vector**: the JSON panels render only the API response objects; the DB (RLS + column grants) already nulls tier-gated payloads for under-tier users, so the viewer can only display what the client is allowed to hold (defense in depth unchanged).
5. **Fixed pre-existing dark-mode cascade bug** (`html.dark` selector): the trailing `@media (prefers-color-scheme: light){:root{...}}` block overrode `.dark` because both match `<html>` with equal specificity and the media block appears later in the file; raising the toggle selector to `html.dark` restores class-based theming (matches DECISION 2026-08-11 #4's hand-rolled theme system).
6. **Pre-existing red tests documented, not silently fixed**: ContentGrid-based `/catalog` specs and the live-DB schema drift (`topics.name` missing) reproduce on a fully clean checkout; noted in AGENT_STATUS/TASKS as owner decisions.

## 2026-08-11 — Schema refactor + Vitest (opencode)

1. **Canonical schema** (user-approved refactor): `users` → `profiles` (id, email, role default 'member', access_level default 4); `contents` → `educational_content` (id, title, description, file_url, access_level 1-4, owner_contact). Implemented as migration `0003` (rename + RLS recreation), keeping the migration chain append-only.
2. **`owner_contact` is public metadata**: it powers the locked-card "Contact with owner" action, so it is granted to `anon`/`authenticated` along with title/description/access_level. Only `file_url` (raw content) is tier-gated.
3. **RLS for `educational_content`**: metadata select policy `using (true)` + full-row tier policy `access_level >= current_access_level()` + column grants (`file_url` → authenticated only). Public (4) and anonymous (NULL level → fail closed) CANNOT query raw Level 1/2/3 content — enforced in the database, not the app.
4. **API contract unchanged**: the `/api/contents*` JSON keeps `required_access_level` as the field name; the routes map the DB column `access_level` → `required_access_level` so the frontend and E2E mocks needed no changes. `owner_contact` was added to the responses and wired into the card's mailto link.
5. **Access logic extracted to `lib/access.ts`**: `canAccessContent` / `isContentLockedFor` / `validateAccessLevel` mirror the SQL predicate and are the single source of truth for API lock decisions; routes now call them instead of inline comparisons.
6. **Unit test framework: Vitest** (`npm test`). Unit tests live in `tests/unit/*.test.ts`; Playwright's `testMatch` is pinned to `**/*.spec.ts` so the two runners never collide.

## 2026-08-11 — Frontend + QA/E2E (opencode)

1. **E2E framework: Playwright** with three projects (desktop 1440px, tablet 768px, mobile Pixel 7). `test:e2e` script added.
2. **Tests run against the production build** (`npm run build && npm run start`) instead of `next dev`: the dev server's on-demand compilation caused navigation timeouts under parallel workers on Windows. Workers capped at 3 for CPU headroom.
3. **API is mocked via `page.route` in card tests** — deterministic UI assertions independent of the (unconfigured) Supabase backend; the app itself falls back to demo data when `/api/contents` is unreachable (demo-mode note shown).
4. **Theme system is hand-rolled** (no next-themes dep): inline init script in `app/layout.tsx` reads `localStorage` (fallback `prefers-color-scheme`) and toggles `.dark` on `<html>` before paint (FOUC-free); `ThemeToggle` persists the choice. CSS uses custom properties per theme; body has a 0.2s color transition.
5. **Content card contract**: locked cards (from `/api/contents` masked payload) render `masked_title`, a lock badge, tier hint, and exactly two actions — "Access it" (`/#upgrade`) and "Contact with owner" (`mailto:`). Unlocked cards render title/description + single "Read" action. Cards carry `data-testid` (`content-card-locked` / `content-card-unlocked`) for QA.
6. **Responsive strategy**: CSS grid `repeat(auto-fill, minmax(280px, 1fr))` for the card grid; mobile nav collapses behind a hamburger at `max-width: 767px` (`aria-expanded` managed); layout tests assert geometry (card x-positions, overflow) rather than fragile computed-style strings.

## 2026-08-11 — Backend foundation (opencode)

1. **Framework: Next.js App Router** (Next 15, React 19, TypeScript, strict).
   - Rationale: `lib/supabase.ts` convention and `/api/*` route shape from the spec map directly to App Router; Supabase SSR support is first-class.
2. **Access-tier model**: `access_level` smallint on `users` and `required_access_level` on `contents` (`1=Owner/100%, 2=Member/50%, 3=Co-member/25%, 4=Public`). Lower number = more privilege. Full-row read allowed when `required_access_level >= user.access_level`.
3. **Access control enforced at the DATABASE layer**, not the app layer:
   - RLS row policy `contents_select_full_by_tier` gates full rows.
   - RLS row policy `contents_select_metadata` (`using (true)`) lets the public list route render lock badges.
   - **Column-level grants**: anon/authenticated get only metadata columns; `body_markdown`/`file_url` are granted to `authenticated` only and still tier-gated by rows. Raw content physically cannot be selected by lower tiers, even with the public anon key.
   - Supabase's blanket default grants are explicitly revoked (`revoke all ... from anon, authenticated`) then re-granted precisely.
4. **`/api/contents` is server-side masking**: it selects metadata only, computes `is_locked` from the requester's tier (anonymous = Public), and nulls out `title`/`description` for locked items, returning `masked_title` + `required_access_level` so the frontend can render lock UI.
5. **`/api/contents/[id]`** returns full content only through the RLS-gated table; unauthorized = 404 (no existence leak), anonymous = 401.
6. **AI abstraction**: `lib/ai/` with an `AIProvider` interface, per-provider modules (`gemini`, `groq`) using dependency-free REST calls (no SDKs), a registry keyed by `AI_PROVIDER_NAMES`, `AI_DEFAULT_PROVIDER` env fallback, and typed errors (`AIProviderConfigError` vs `AIProviderError`). New providers = new file + one registry entry.
7. **`/api/ai/generate` requires authentication** (prevents open-proxy abuse) and validates/limits body (message count, length, provider/model allowlists).
8. **New signups auto-start at Public tier** via trigger `on_auth_user_created`; tier upgrades are an owner-only operation (RLS-guarded writes).
9. **New users of `users`/`categories`/`contents` tables get blanket Supabase grants by default** — future tables must also `revoke all ... from anon, authenticated` unless deliberately public.
