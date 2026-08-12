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
| `scripts/migrate-content.mjs` — imports 135 JSON files from `../ravikishan/migrated-content` into Supabase hierarchy (exam_groups → subjects → chapters → sub_chapters → topics → content_items) | Done |
| `netlify.toml` — Netlify deployment config (Next.js 15 App Router, Node 22, redirects) | Done |
| `@netlify/plugin-nextjs` added as devDependency | Done |
| `package.json` — added `migrate:content` script | Done |
| Deployment switched from Vercel to Netlify | Done |
| Footer moved to home page only (removed from catalog layout) | Done |
| Header: removed "Catalog" nav link; added quick-access icons (notifications, saved, profile, upgrade-to-premium pill) | Done |
| PRO AI BUILD PROMPT saved as `prompts/pro-ai-build.md` for Cline/Kilo Code | Done |
| Site is live on Netlify and verified | Done |

### History
- (2026-08-11) Backend foundation delivered (migrations, RLS, API routes, AI abstraction). All verification passing.
- (2026-08-11) Aider removed; opencode takes over frontend + QA responsibilities.
- (2026-08-11) Frontend + Playwright E2E delivered: 45 tests green across desktop/tablet/mobile.
- (2026-08-11) Schema refactored to canonical names: `profiles` (id, email, role, access_level) and `educational_content` (id, title, description, file_url, access_level 1-4, owner_contact). RLS recreated: Public (4) and anonymous users cannot query raw L1-3 content. Vitest suite added (`npm test`, 15 tests) covering the full access matrix.
- (2026-08-12) Supabase client split into `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server). Catalog page at `/catalog` with Access Tiers 1-4 legend. Locked cards mask raw `file_url` on the frontend (defense-in-depth; RLS is the real gate). Playwright suite expanded to 72 tests, all green.