# DECISIONS

Decisions recorded in reverse chronological order.

## 2026-08-15 — Auth / Admin / Info flow (opencode)

1. **New signups start as pending (tier 4 = Public)** via the `handle_new_user()` trigger in migration 0012. The trigger sets `profiles.status = 'pending'` and `access_level = 4`. Owners must approve accounts before they can log in.
2. **`get_content_item()` enforces the approval gate** in migration 0013: non-owner users whose profile is not `active` cannot read `locked_payload` or `variants`, even if their tier would otherwise pass. Owners (`access_level = 1`) bypass the status check.
3. **Auth routes are simple REST wrappers** around Supabase Auth (`signUp`, `signInWithPassword`, `signOut`). The signup route does not auto-login; the signin route returns 403 for pending/rejected accounts with a contact email.
4. **Admin route is owner-only** via explicit session + access_level checks (defense in depth on top of RLS). It returns all profiles and supports PATCH updates to `status` and `access_level`.
5. **Login page uses tabs** (Sign in / Create account) with the existing `.btn`, `.btn-primary`, `.btn-secondary` base styles. Pending accounts see a notice with `ravikisan1814@gmail.com`.
6. **SiteHeader uses the browser Supabase client** to read the session on mount. Signed-out users see a "Sign in" pill; signed-in users see a profile dropdown with email + tier label. Owners see an extra "Member management" link to `/admin`. Sign out calls the API and redirects to `/`.
7. **LockedSection now shows the owner email** as a visible line inside the overlay: "Contact with owner: <email>".

## 2026-08-14 — Home restructure: 3 sections + global search (opencode)

1. **Home page shows exactly three top-level sections** — Class 11, Class 12, Knowledge — each with nested sub-sections:
   - Class 11 → Class 11 notes, Class 11E, Class 11 more
   - Class 12 → Class 12 notes, Class 12E, Class 12 more
   - Knowledge → Loksewa knowledge, World knowledge
2. **Outer navigation is NEVER locked.** Users click into any section/sub-section freely. Locks only appear INSIDE content items (the existing 90% in-content gate handled by `ContentItemViewer`/`LockedSection`). This matches the user's requirement: "lock those sections inside not outside; lock on opening it only".
3. **The old static home grids were removed** (`SUBJECTS`, `CLASS_11_SECTIONS`, `CLASS_12_SECTIONS`, `CONTENT_BLOCKS` in `lib/content-structure.ts`) and replaced with `HOME_SECTIONS` — a data-driven catalogue that maps each sub-section to an exam-group slug (and optional subject slug) so the `HomeExplorer` can pull matching content from `/api/hierarchy`.
4. **Global search bar added to the header** (`components/GlobalSearch.tsx`). It searches subjects/chapters/topics from `/api/hierarchy` and shows tagged results (Subject/Chapter/Topic) in a dropdown. Keyboard: `/` or Cmd/Ctrl+K to focus, Esc to close.
5. **Demo hierarchy updated** in `/api/hierarchy/route.ts` to the new group slugs (`class-11`, `class-11e`, `class-11-more`, `class-12`, `class-12e`, `class-12-more`, `loksewa`, `general-knowledge`) so the home explorer and search have content when Supabase env vars are not configured.

## 2026-08-13 — Notes architecture integration (opencode)

1. **Ravikishan notes architecture mapped onto our existing Supabase hierarchy** (`exam_groups -> subjects -> chapters -> sub_chapters -> topics -> content_items`). No new tables — the 8 authoring folders (`concepts/note/example/formula/pyq/set/mindmap/graph`) map to `sub_chapters` (as before) and the canonical `BlockType` id is stored on `content_items.block_type` (migration 0005).
2. **Access tiers remapped** from the ravikishan 1/2/3 scale onto OUR AccessLevel union (lower = more access): ravikishan 3 (free) → our 4 (Public), 2 (member) → our 2 (Member), 1 (premium) → our 1 (Owner). The RLS predicate `content_items.access_level >= current_access_level()` is unchanged — the importer just writes the mapped value.
3. **Block metadata is PUBLIC** (`block_type`, `section_index`, `note_type`, `metadata`): they drive the syllabus map + block-type styling + the 11-section render order. The 90% payload stays behind `get_content_item()` exactly as before; `metadata` never carries the locked body (graph specs stay in `variants` JSONB, interface `"graph"`, as the existing model already does).
4. **Single TS source of truth for the notes taxonomy** lives in `lib/access.ts` (section order, degradation, folder→block-type, folder→access, labels) with a mirror SQL in migration 0005 and the same contract in the importer — kept in lockstep, tested by `tests/unit/notes-architecture.test.ts`.
5. **11 canonical sections** (append-only render order) drive `section_index` and the viewer content-degradation rule (15% → 100%). The degradation rule is additive: legacy items without a block type default to index 3 (concept) without breaking the existing reader.
6. **Subject catalogue mirrored onto `subjects`**: `subject_type`, `icon`, `theme_color`, `is_locked` metadata columns (public read) match the ravikishan `SUBJECTS` map, covering our Loksewa/GK/academic slugs.

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
