# SECURITY

## Threat model
The public `anon` key ships to the browser. All protection therefore lives
server-side: in PostgreSQL (RLS + column grants), in auth-gated routes, and
in the server-only handling of secrets.

## Access tiers
- `profiles.access_level`: 1=Owner, 2=Member, 3=Co-member, 4=Public (lower = more access).
- `educational_content.access_level`: minimum tier required to read the raw content.
- Rule enforced in SQL: full rows visible only when
  `access_level >= (select access_level from profiles where id = auth.uid())`.
- Public (4) and anonymous users CANNOT query raw (Level 1/2/3) content —
  `file_url` is not granted to `anon` at all, and tiered rows are filtered
  from lower-tier authenticated users.

## Database-level controls (defense in depth)
- RLS enabled on `profiles`, `categories`, `educational_content`.
- `educational_content` has TWO select policies (OR'd):
  - `educational_content_select_metadata` — metadata rows (title, description,
    access_level, owner_contact) visible to everyone; powers lock-badge lists
    and the "Contact with owner" action.
  - `educational_content_select_full_by_tier` — raw content (`file_url`) only
    on rows meeting the user's tier.
- **Column grants** are the hard backstop: `file_url` is not granted to
  `anon` at all; for `authenticated` it is still row-filtered by the tier
  policy. A lower-tier client cannot read raw content even by querying the
  database directly.
- Blanket Supabase grants (`revoke all ... from anon, authenticated`) are
  revoked and re-granted precisely. **Any new table in `public` must repeat
  this revoke pattern** unless it is intentionally public.
- Admin writes (content CRUD, tier changes) are owner-only via RLS
  (`current_access_level() = 1`); the service_role key (bypasses RLS) is for
  server-only admin tooling.

## Account approval
- New signups are created with `profiles.status = 'pending'` (migration 0012).
- The `get_content_item()` RPC checks profile status: only `active` users or owners (`access_level = 1`) can read the locked payload (migration 0013).
- Pending/rejected accounts cannot log in (signin route returns 403).

## API layer
- `GET /api/contents` — public; never selects `file_url`; masks
  title/description of locked items; exposes `is_locked`,
  `required_access_level`, `masked_title`, `owner_contact`.
- `GET /api/contents/[id]` — 401 anonymous; 404 for not-found OR insufficient
  tier (indistinguishable, no existence leak).
- `POST /api/ai/generate` — authentication required (no open proxy); body
  validated with hard caps (message count, char length, provider/model
  allowlists); API keys read from env server-side only; upstream failures
  mapped to 502/503 without leaking internals.
- `lib/supabase-admin.ts` imports `server-only` so the service role key can
  never be bundled into client code.

## Unit-tested invariants
`lib/access.ts` (the TS mirror of the RLS predicate) is covered by Vitest:
full access matrix, the "Public cannot read raw L1/2/3" requirement,
anonymous fail-closed behavior, and level validation.

## Secrets
- `.env.local` (gitignored) holds `SUPABASE_SERVICE_ROLE_KEY`,
  `GEMINI_API_KEY`, `GROQ_API_KEY`. `.env.example` documents names only.
- Only `NEXT_PUBLIC_*` values are safe to expose.

## Incident log
### 2026-08-12 — Supabase secret key blocked by GitHub push protection
- A real Supabase secret key was committed in `.env.local` in a local commit
  (`6beb1b56`, "Deploying platform to Vercel"). GitHub push protection
  rejected the push to `main` (GH013) and flagged the secret.
- The commit was a **dangling local object** — it was never merged into
  `origin/main`; the remote history (`fbb6eab` → `0537ea2` → …) is clean.
- Remediation:
  1. Confirmed `.env.local` is covered by `.gitignore` (`.env*.local`) and is
     not tracked by git.
  2. Confirmed `.env.local` no longer exists in the working directory.
  3. Purged the dangling commit from the local object store:
     `git reflog expire --expire=now --all && git gc --prune=now`.
  4. Verified the object is unrecoverable (`git cat-file` fails).
- **Action required by owner:** rotate the exposed Supabase key in the
  Supabase dashboard (the anon key is client-safe by design, but the flagged
  value should still be rotated if it was a service-role key). Do not
  re-create `.env.local` from the old value.
