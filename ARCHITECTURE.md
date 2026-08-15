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
  0004_hierarchy_content_items.sql  deep hierarchy: exam_groups -> subjects ->
                         chapters -> sub_chapters -> topics -> content_items
                         (10% public_teaser / 90% locked_payload + variants,
                         SECURITY DEFINER get_content_item() gate)
  0005_notes_architecture_blocks.sql  notes-architecture block metadata:
                         content_items.block_type / section_index / note_type /
                         metadata (public), subjects.subject_type / icon /
                         theme_color / is_locked (catalogue), get_content_item()
                         returns the block metadata

  lib/
    supabase.ts            cookie-based server client (RLS applies) — route handlers
    supabase-server.ts     cookie-based server client (RLS applies) — route handlers
    supabase-client.ts     browser client (hoisted literal env reads) — client components
    supabase-admin.ts      service_role client, 'server-only' guarded (admin tooling)
    access.ts              access-control helpers mirroring the RLS predicate
                          (canAccessContent / isContentLockedFor / validateAccessLevel)
    types.ts               shared domain types + access-level helpers
    ai/
      types.ts             AIProvider interface, request/response contracts
      errors.ts            AIProviderConfigError / AIProviderError
      providers/gemini.ts  Gemini REST provider
      providers/groq.ts    Groq REST provider
      providers/together.ts Together AI REST provider
      providers/huggingface.ts Hugging Face REST provider
      providers/openrouter.ts OpenRouter REST provider
      index.ts             provider registry + generateAI() entry point

  components/
    SiteHeader.tsx         responsive header (hamburger nav + ThemeToggle + real session auth)
    ThemeToggle.tsx        dark/light toggle (localStorage + prefers-color-scheme)
    ContentCard.tsx        locked/unlocked card states (Access it / Contact with owner / Read)
    ContentGrid.tsx        client fetcher for /api/contents with demo-data fallback
    AdminPanel.tsx         owner-only member management (status badges + tier select)
    AiChatWidget.tsx       floating AI chat widget (bottom-right, all pages)

  app/
    globals.css            design tokens (light/dark custom properties) + layout CSS
    layout.tsx             root layout + pre-paint theme init script (FOUC-free) + AiChatWidget
    page.tsx               home: header, hero, content grid, footer
    login/page.tsx         sign in / create account tabs (pending approval notice)
    admin/page.tsx         owner-only member management page
    info/page.tsx          Rules & Notices (tier percentages, notices, owner contact)
    api/
      auth/
        signup/route.ts    POST — create auth user; trigger sets profiles.status = 'pending'
        signin/route.ts    POST — signin; pending/rejected accounts return 403
        signout/route.ts   POST — signout
      admin/
        users/route.ts     GET owner-only user list + PATCH approve/hold/reject/tier
      contents/route.ts    GET — public list: metadata + is_locked, masked titles
      contents/[id]/route.ts GET — full content, RLS-gated (401 anon / 404 no-access)
      ai/
        generate/route.ts  POST — authenticated LLM proxy over lib/ai
        chat/route.ts      POST — platform-scoped chat with syllabus context

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
- **Auth**: signup creates an auth user + pending profile via trigger; signin
  rejects pending/rejected accounts; signout clears the session.
- **Admin**: `/api/admin/users` is owner-only (RLS + explicit access_level check).
  Supports listing all profiles and PATCH updates to status/access_level.
- **AI**: route validates the request, `lib/ai` resolves provider (request →
  `AI_DEFAULT_PROVIDER` → gemini), provider calls the upstream REST API with
  env-key auth, and normalizes the response.
- **Theming**: inline script in the root layout applies `.dark` before paint
  (localStorage first, system preference second); CSS custom properties swap
  palette. No FOUC, no external dependency.

## Testing

- `npm test` — Vitest unit tests (`tests/unit/`): access matrix, Public
  cannot read raw L1-3, anonymous fail-closed, level validation, notes
  architecture contract.
- `npx playwright test` — builds the app, serves it on :3100, runs 90 E2E
  tests across three viewport projects. Card tests mock `/api/contents` via
  `page.route` for determinism; layout tests assert geometry.

## Migrations

- `0001_init.sql` — users/categories/contents + RLS + column grants
- `0002_seed_categories.sql` — standard category slugs
- `0003_profiles_educational_content.sql` — refactor: profiles (role) + educational_content
  (access_level, owner_contact), RLS recreated
- `0004_hierarchy_content_items.sql` — deep hierarchy: exam_groups -> subjects ->
  chapters -> sub_chapters -> topics -> content_items
  (10% public_teaser / 90% locked_payload + variants,
  SECURITY DEFINER get_content_item() gate)
- `0005_notes_architecture_blocks.sql` — notes-architecture block metadata:
  content_items.block_type / section_index / note_type /
  metadata (public), subjects.subject_type / icon /
  theme_color / is_locked (catalogue), get_content_item()
  returns the block metadata
- `0012_auth_approval.sql` — profiles.status + approval trigger + admin RLS
- `0013_content_approval_gate.sql` — get_content_item() approval gate

## Extending

- New access tier → add label in `lib/types.ts::ACCESS_LEVEL_LABELS`.
- New AI provider → implement `AIProvider` in `lib/ai/providers/`, register in `lib/ai/index.ts::AI_PROVIDERS`, add key to `.env.example`.
- New public table → remember to `revoke all ... from anon, authenticated` and grant precisely (see SECURITY.md).
- New viewport target → add a project in `playwright.config.ts`.
