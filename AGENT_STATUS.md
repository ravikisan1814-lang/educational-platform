# AGENT STATUS

Last updated: 2026-08-12

## Current Agent: opencode (backend + frontend QA/E2E)

> Aider has been removed from the project. opencode now owns Aider's
> responsibilities (frontend) in addition to backend and QA/E2E.

### Status: CHAT PAGE + MISTRAL PROVIDER + BUGFIXES COMPLETE

### Tasks (this session)
| Task | Status |
| --- | --- |
| `app/chat/page.tsx` + `components/ChatInterface.tsx` — AI chat UI (provider selector, message history, loading/error states) | Done |
| `lib/ai/providers/mistral.ts` — Mistral provider added to registry (`MISTRAL_API_KEY`, default model `mistral-large-latest`) | Done |
| `lib/ai/types.ts` — `AIProviderName` extended with `"mistral"` | Done |
| `.env.example` — documented `MISTRAL_API_KEY` | Done |
| `app/globals.css` — chat styles (light/dark) | Done |
| `components/SiteHeader.tsx` — added Chat nav link | Done |
| Fix: `tests/responsive-layout.spec.ts:69` — stale hero assertion expected "educational content" on `/`, but `/` permanently redirects to `/catalog` (hero is "Content Catalog") → 3/3 projects failing | Fixed |
| Fix: `ChatInterface` — assistant message badges showed the *currently selected* provider instead of the provider that generated the message; each assistant message now records its own `provider` | Fixed |
| Fix: `ChatInterface` — removed emoji glyphs from provider `<option>` labels (repo convention: no emojis) | Fixed |
| Verification: tsc, lint, build, `npm test` (15/15), `npx playwright test` (72/72, incl. re-run of responsive-layout.spec) | Done — all pass |

### History
- (2026-08-11) Backend foundation delivered (migrations, RLS, API routes, AI abstraction). All verification passing.
- (2026-08-11) Aider removed from project; opencode takes over frontend + QA responsibilities.
- (2026-08-11) Frontend + Playwright E2E delivered: 45 tests green across desktop/tablet/mobile.
- (2026-08-11) Schema refactored to canonical names: `profiles` (id, email, role, access_level) and `educational_content` (id, title, description, file_url, access_level 1-4, owner_contact). RLS recreated: Public (4) and anonymous users cannot query raw L1-3 content. Vitest suite added (`npm test`, 15 tests) covering the full access matrix.
- (2026-08-12) Chat page + Mistral provider + bugfixes. `/chat` UI with provider selector (Mistral/Gemini/Groq), Mistral provider registered in `lib/ai`. Fixed a stale E2E assertion (home redirect to `/catalog` broke the hero-heading check in `responsive-layout.spec.ts`) and a ChatInterface bug where assistant badges mislabeled messages after switching providers. Full suite green: tsc, lint, build, Vitest 15/15, Playwright 72/72.
- (2026-08-12) Supabase client split into `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server). Catalog page at `/catalog` with Access Tiers 1-4 legend. Locked cards mask raw `file_url` on the frontend (defense-in-depth; RLS is the real gate). Playwright suite expanded to 72 tests, all green.