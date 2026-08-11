# AGENTS.md — Agent working agreement

This repo is built by multiple AI agents (opencode, Aider). Follow these rules.

## Ground rules
- Read this file and AGENT_STATUS.md first. Record what you start/finish in AGENT_STATUS.md.
- When your work is ready for another agent to verify, announce it in TASKS.md with exact steps.
- Record non-trivial decisions in DECISIONS.md, security posture changes in SECURITY.md, layout changes in ARCHITECTURE.md.

## Stack & conventions
- Next.js 15 App Router, TypeScript strict, ESLint (`eslint .`), paths alias `@/*` → project root.
- Verification commands: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm test` (Vitest unit), `npx playwright test` (E2E).
- Supabase: migrations in `supabase/migrations/` (numeric prefix, order matters). Access control lives in PostgreSQL (RLS + column grants), never only in app code.
- Access tiers: 1=Owner, 2=Member, 3=Co-member, 4=Public. Full content readable when `access_level >= user.access_level`.
- The access decision has a single TS source of truth in `lib/access.ts` — change the SQL predicate and the TS mirror together, and keep `tests/unit/access.test.ts` green.
- Client code uses `lib/supabase.ts` (RLS applies). `lib/supabase-admin.ts` is service_role, `server-only`, never in browser bundles or commits.
- AI calls go through `lib/ai` (provider registry). Never call Gemini/Groq directly from routes or components.
- Secrets live in `.env.local` (gitignored); `.env.example` documents names only. Never commit real keys.
