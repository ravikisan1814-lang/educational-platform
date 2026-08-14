# AGENT STATUS

Last updated: 2026-08-13

## Primary Agent: opencode

### Supported Development Tools
- **Cline** — supported development tool
- **opencode** — primary AI agent for development
- **Kilo code** — supported development tool
- **Local tools** — Ollama and other local LLM providers

### Removed Tools
- Aider (removed 2026-08-12)
- continue dev (removed 2026-08-12)
- roo code (removed 2026-08-12)
- Devin desktop (removed 2026-08-12)

### Status: HOME RESTRUCTURE (3 SECTIONS + GLOBAL SEARCH) — COMPLETE

### Tasks (this session)
| Task | Status |
| --- | --- |
| `lib/content-structure.ts` — replaced old static `SUBJECTS`/`CLASS_11_SECTIONS`/`CLASS_12_SECTIONS`/`CONTENT_BLOCKS` with `HOME_SECTIONS` (Class 11 → notes/E/more, Class 12 → notes/E/more, Knowledge → Loksewa/World) | Done |
| `components/home/HomeExplorer.tsx` — expandable 3-section explorer; sub-sections open subjects → chapters → sub-chapters → topics from `/api/hierarchy`; outer navigation NEVER locked | Done |
| `components/GlobalSearch.tsx` — global search bar in header; searches subjects/chapters/topics; tagged results dropdown; `/` or Cmd/Ctrl+K focus, Esc close | Done |
| `components/SiteHeader.tsx` — added the global search bar | Done |
| `app/page.tsx` — now renders only the 3 home sections via `HomeExplorer` (removed old static grids) | Done |
| `app/api/hierarchy/route.ts` — demo hierarchy updated to new group slugs (`class-11`, `class-11e`, `class-11-more`, `class-12`, `class-12e`, `class-12-more`, `loksewa`, `general-knowledge`) | Done |
| `app/globals.css` — styles for home explorer + global search (responsive) | Done |
| `tests/responsive-layout.spec.ts` — updated to assert the 3 home sections render on every viewport | Done |
| `npx tsc --noEmit` — passes | Done |
| `npm test` — 37/37 passing | Done |
| `npm run lint` — passes | Done |

### History
- (2026-08-13) Notes-architecture integration — see `NOTE: no git push yet (user: "no push to git yet")`. `npx tsc --noEmit` ✅ and `npm run build` ✅ (Next.js production build incl. lint+type-check). `npm test` ⚠️ blocked by a pre-existing Vitest 4 worker crash (`reading 'config'` on a bare probe import — affects the pre-existing test files too; not caused by this change).
- (2026-08-11) Backend foundation delivered (migrations, RLS, API routes, AI abstraction). All verification passing.
- (2026-08-11) Aider removed; opencode takes over frontend + QA responsibilities.
- (2026-08-11) Frontend + Playwright E2E delivered: 45 tests green across desktop/tablet/mobile.
- (2026-08-11) Schema refactored to canonical names: `profiles` (id, email, role, access_level) and `educational_content` (id, title, description, file_url, access_level 1-4, owner_contact). RLS recreated: Public (4) and anonymous users cannot query raw L1-3 content. Vitest suite added (`npm test`, 15 tests) covering the full access matrix.
- (2026-08-12) Supabase client split into `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server). Catalog page at `/catalog` with Access Tiers 1-4 legend. Locked cards mask raw `file_url` on the frontend (defense-in-depth; RLS is the real gate). Playwright suite expanded to 72 tests, all green.