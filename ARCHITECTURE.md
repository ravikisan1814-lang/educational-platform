# ARCHITECTURE

Stack: **Next.js 15 App Router** (TypeScript, strict) + **Supabase**
(PostgreSQL + Auth) + provider-agnostic AI layer. E2E via **Playwright**.

## Layout

```
supabase/migrations/
  0001_init.sql          schema: users/categories/contents + RLS + column grants
  0002_seed_categories.sql  standard category slugs
  0003_profiles_educational_content.sql  refactor: profiles (role) + educational_content
                         (access_level, owner_contact), RLS recreated

lib/
  supabase.ts            cookie-based server client (RLS applies) — route handlers
  supabase-admin.ts      service_role client, 'server-only' guarded (admin tooling)
  access.ts              access-control helpers mirroring the RLS predicate
                         (canAccessContent / isContentLockedFor / validateAccessLevel)
  types.ts               shared domain types + access-level helpers
  ai/
    types.ts             AIProvider interface, request/response contracts
    errors.ts            AIProviderConfigError / AIProviderError
    providers/gemini.ts  Gemini REST provider
    providers/groq.ts    Groq REST provider
    index.ts             provider registry + generateAI() entry point

components/
  SiteHeader.tsx         responsive header (hamburger nav + ThemeToggle), client
  ThemeToggle.tsx        dark/light toggle (localStorage + prefers-color-scheme)
  ContentCard.tsx        locked/unlocked card states (Access it / Contact with owner / Read)
  ContentGrid.tsx        client fetcher for /api/contents with demo-data fallback

app/
  globals.css            design tokens (light/dark custom properties) + layout CSS
  layout.tsx             root layout + pre-paint theme init script (FOUC-free)
  page.tsx               home: header, hero, content grid, footer
  login/page.tsx         client: Sign in / Create account tabs, pending-approval notice
  info/page.tsx          "Rules & Notices": tier % table, official notices, owner contact
  admin/page.tsx         server owner-check + AdminPanel (member management)
  api/
    contents/route.ts    GET — public list: metadata + is_locked, masked titles
    contents/[id]/route.ts GET — full content, RLS-gated (401 anon / 404 no-access)
    ai/generate/route.ts POST — authenticated LLM proxy over lib/ai
    auth/signin, signup, signout/route.ts  POST — cookie-session email/password auth
    admin/users/route.ts GET/PATCH — owner-only member list + status/tier changes

tests/
  unit/access.test.ts    Vitest: access-control matrix (npm test)
  *.spec.ts              Playwright E2E (desktop/tablet/mobile projects)
playwright.config.ts     3 projects + production-server webServer
vitest.config.ts         unit-test runner (tests/unit/**)
```

## Data flow

- **List**: `/api/contents` builds a cookie client → selects metadata columns
  (column grants) → resolves requester tier (anonymous = Public) → masks
  locked items via `lib/access.ts::isContentLockedFor`. The page's
  `ContentGrid` fetches it; on failure it falls back to demo data so the UI
  (and E2E) works without a configured backend.
- **Detail**: `/api/contents/[id]` requires a session; RLS row policy decides
  whether the full row (including `file_url`) is returned. The database,
  not the route, is the access-control enforcement point — Public (4) and
  anonymous users cannot retrieve raw Level 1/2/3 content.
- **AI**: route validates the request, `lib/ai` resolves provider (request →
  `AI_DEFAULT_PROVIDER` → gemini), provider calls the upstream REST API with
  env-key auth, and normalizes the response.
- **Theming**: inline script in the root layout applies `.dark` before paint
  (localStorage first, system preference second); CSS custom properties swap
  palette. No FOUC, no external dependency.
- **Auth**: route handlers call `supabase.auth.*` with the cookie-based server
  client; the browser never sees Supabase Auth keys beyond the publishable
  anon key. Signup → `handle_new_user` trigger writes a `pending` profile;
  approved signins redirect to `/learn`.
- **Admin**: server component on `/admin` checks the session tier (owner +
  approved), then the client panel calls `/api/admin/users`; PATCHes go
  through RLS (`current_access_level() = 1` on `profiles`), the real gate.

## Testing

- `npm test` — Vitest unit tests (`tests/unit/`): access matrix, Public
  cannot read raw L1-3, anonymous fail-closed, level validation.
- `npx playwright test` — builds the app, serves it on :3100, runs 45 E2E
  tests across three viewport projects. Card tests mock `/api/contents` via
  `page.route` for determinism; layout tests assert geometry.

## Extending

- New access tier → add label in `lib/types.ts::ACCESS_LEVEL_LABELS`.
- New AI provider → implement `AIProvider` in `lib/ai/providers/`, register in `lib/ai/index.ts::AI_PROVIDERS`, add key to `.env.example`.
- New public table → remember to `revoke all ... from anon, authenticated` and grant precisely (see SECURITY.md).
- New viewport target → add a project in `playwright.config.ts`.
