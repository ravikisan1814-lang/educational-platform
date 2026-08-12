# AGENT STATUS

Last updated: 2026-08-12

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

### Status: SITE IS LIVE ON NETLIFY — AGENT MIGRATION + PENDING CHANGES READY

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
- (2026-08-11) Aider removed; opencode takes over frontend + QA responsibilities.
- (2026-08-11) Frontend + Playwright E2E delivered: 45 tests green across desktop/tablet/mobile.
- (2026-08-11) Schema refactored to canonical names: `profiles` (id, email, role, access_level) and `educational_content` (id, title, description, file_url, access_level 1-4, owner_contact). RLS recreated: Public (4) and anonymous users cannot query raw L1-3 content. Vitest suite added (`npm test`, 15 tests) covering the full access matrix.
- (2026-08-12) Chat page + Mistral provider + bugfixes. `/chat` UI with provider selector (Mistral/Gemini/Groq), Mistral provider registered in `lib/ai`. Fixed a stale E2E assertion (home redirect to `/catalog` broke the hero-heading check in `responsive-layout.spec.ts`) and a ChatInterface bug where assistant badges mislabeled messages after switching providers. Full suite green: tsc, lint, build, Vitest 15/15, Playwright 72/72.
- (2026-08-12) Supabase client split into `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server). Catalog page at `/catalog` with Access Tiers 1-4 legend. Locked cards mask raw `file_url` on the frontend (defense-in-depth; RLS is the real gate). Playwright suite expanded to 72 tests, all green.

- (2026-08-12) Agent migration to Cline/opencode/Kilo code, home-only footer, header quick-access, PRO AI BUILD prompt
- (2026-08-12) Removed tools: Aider, continue dev, roo code
- (2026-08-12) Footer moved to home page only (removed from catalog layout)
- (2026-08-12) Header: removed "Catalog" nav link; added quick-access icons (notifications, saved, profile, upgrade-to-premium pill)
- (2026-08-12) PRO AI BUILD PROMPT saved as `prompts/pro-ai-build.md` for Cline/Kilo Code
- (2026-08-12) Site is live on Netlify and verified