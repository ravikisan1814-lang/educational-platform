# AGENTS.md — Development tools agreement

This repo is developed by opencode with support for Cline, Kilo code, and local development tools (Ollama, etc.). Follow these rules.

## Ground rules
- Read this file and AGENT_STATUS.md first. Update AGENT_STATUS.md with progress.
- When work is complete, document verification steps in TASKS.md.
- Record non-trivial decisions in DECISIONS.md, security posture changes in SECURITY.md, layout changes in ARCHITECTURE.md.
- Supported development tools: Cline, opencode, Kilo code, VS Code, Ollama (local LLMs).

## Stack & conventions
- Next.js 15 App Router, TypeScript strict, ESLint (`eslint .`), paths alias `@/*` → project root.
- Verification commands: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm test` (Vitest unit), `npx playwright test` (E2E).
- Supabase: migrations in `supabase/migrations/` (numeric prefix, order matters). Access control lives in PostgreSQL (RLS + column grants), never only in app code.
- Access tiers: 1=Owner, 2=Member, 3=Co-member, 4=Public. Full content readable when `access_level >= user.access_level`.
- The access decision has a single TS source of truth in `lib/access.ts` — change the SQL predicate and the TS mirror together, and keep `tests/unit/access.test.ts` green.
- Client code uses `lib/supabase.ts` (RLS applies). `lib/supabase-admin.ts` is service_role, `server-only`, never in browser bundles or commits.
- AI calls go through `lib/ai` (provider registry). Never call Gemini/Groq directly from routes or components.
- Secrets live in `.env.local` (gitignored); `.env.example` documents names only. Never commit real keys.
