# CHANGELOG

## 2026-08-12 — Site live on Netlify + header/footer polish + PRO AI BUILD prompt
- Footer moved to home page only (removed from `/catalog` layout).
- Header: removed "Catalog" nav link; added quick-access icons (notifications with badge, saved items, avatar profile dropdown, "Upgrade to Premium" gold pill).
- PRO AI BUILD PROMPT saved as `prompts/pro-ai-build.md` for Cline/Kilo Code premium dashboard build.
- Site deployed and live on Netlify.

## 2026-08-12 — Development tools migration
- Migrated from Aider to Kilo code.
- Removed continue dev, roo code, and Devin desktop tool references.
- Added Cline as a supported development tool.
- Updated AGENTS.md and AGENT_STATUS.md with the current three agents: Cline, opencode, Kilo code.

## 2026-08-11 — Schema refactor + Vitest
- Migration `0003`: `users`→`profiles` (+`role`), `contents`→`educational_content` (+`owner_contact`, `required_access_level`→`access_level`); RLS recreated under new names. Public (4)/anon cannot query raw L1-3 content.
- Access logic extracted to `lib/access.ts` (mirrors the RLS predicate); API routes now use it.
- Vitest added (`npm test`): 15 unit tests for the access matrix in `tests/unit/access.test.ts`. Playwright `testMatch` pinned to `**/*.spec.ts` to avoid runner collision.
- `owner_contact` wired through list/detail responses into the locked-card "Contact with owner" mailto link.

## 2026-08-11 — Frontend + QA/E2E
- Playwright configured with 3 viewport projects (desktop/tablet/mobile); tests run against the production build for stability.
- UI: content cards with locked/unlocked states, dark/light theme system (FOUC-free, persisted), responsive header with hamburger nav.
- E2E suite (45 tests): locked-card actions, theme toggle/persistence/system preference, responsive layout.
- Removed Aider from the project; opencode owns backend + frontend + QA.

## 2026-08-11 — Backend foundation
- Scaffolded Next.js 15 App Router backend (TS strict, ESLint, path alias).
- SQL migrations: `users`/`categories`/`contents` + tier RLS (row policies) + column grants (defense in depth); category seed.
- `lib/supabase.ts` (RLS cookie client) and `lib/supabase-admin.ts` (service role, server-only).
- AI abstraction `lib/ai` with Gemini + Groq REST providers behind a registry.
- API routes: `GET /api/contents` (masked list), `GET /api/contents/[id]` (RLS-gated), `POST /api/ai/generate` (auth-gated).
- Governance docs seeded: AGENTS.md, AGENT_STATUS.md, ARCHITECTURE.md, DECISIONS.md, SECURITY.md, TASKS.md.
