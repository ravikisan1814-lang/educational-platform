# Educational Platform

Tiered-access educational content platform: free and premium notes for
Class 11, Class 12, General Knowledge and Loksewa.

## Stack

- Next.js 15 (App Router, TypeScript strict)
- Supabase (PostgreSQL + RLS access control + Auth)
- AI layer abstracting Gemini/Groq (`lib/ai`)
- Playwright E2E (desktop / tablet / mobile projects)

## Access tiers

`1=Owner` (100%) · `2=Member` (50%) · `3=Co-member` (25%) · `4=Public`.
Full content is readable when `required_access_level >= user.access_level`,
enforced by PostgreSQL RLS + column grants.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill real values
npm run dev
```

## Verification

```bash
npx tsc --noEmit   # typecheck
npm run lint       # eslint
npm run build      # production build
npx playwright test  # E2E (45 tests, builds app + serves on :3100)
```

## API

- `GET /api/contents` — public list with lock metadata (masked titles for locked items)
- `GET /api/contents/[id]` — full content, RLS-gated
- `POST /api/ai/generate` — authenticated LLM proxy (gemini/groq)

## Docs

Architecture, decisions, security posture and task tracking live in
`ARCHITECTURE.md`, `DECISIONS.md`, `SECURITY.md`, `TASKS.md`, `AGENT_STATUS.md`.
