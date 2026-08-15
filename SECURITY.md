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
- `POST /api/auth/signin|signup|signout` — email+password via Supabase Auth
  (cookie sessions, server-side client). Signup always reports the pending
  approval state; no profile row is ever written from the client (the
  `handle_new_user` trigger owns creation).
- `GET|PATCH /api/admin/users` — owner-only (route checks the session +
  `access_level = 1` + `status = 'approved'`; the RLS update policy
  `current_access_level() = 1` is the hard gate). 401 unsigned / 403
  non-owner; input validated (`status` ∈ pending/approved/rejected,
  `access_level` ∈ 1-4).

## Approval gate (`profiles.status`)
- Migrations 0012/0013: new signups start `status = 'pending'` (trigger
  `handle_new_user`); existing users backfilled `approved`.
- Tier gates fail closed for non-approved users: `get_content_item` and the
  `educational_content` full-content policy require an approved profile for
  levels 1-3. Level-4 (Public) items stay open to everyone, including
  anonymous visitors (0013).
- `profiles` grants (0012): `select` on (id, email, role, access_level,
  status, created_at) and `update` on (access_level, status) for
  `authenticated`, still row-gated by the owner-only RLS policy
  (`current_access_level() = 1`).

## Unit-tested invariants
`lib/access.ts` (the TS mirror of the RLS predicate) is covered by Vitest:
full access matrix, the "Public cannot read raw L1/2/3" requirement,
anonymous fail-closed behavior, and level validation.

## Secrets
- `.env.local` (gitignored) holds `SUPABASE_SERVICE_ROLE_KEY`,
  `GEMINI_API_KEY`, `GROQ_API_KEY`. `.env.example` documents names only.
- Only `NEXT_PUBLIC_*` values are safe to expose.

## Incident log
### 2026-08-15 — Secret key used as the anon key + blanket table grants (RESOLVED)
- `.env.local` had a **`sb_secret_…` (SECRET) key in the `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  slot**. `NEXT_PUBLIC_*` values are inlined into the public browser bundle, so the
  secret was downloadable by any visitor — full database access via REST.
- Independently, the live DB (older schema generation) still had **blanket table-level
  grants** (`grant all … to anon, authenticated`) on `content_items` /
  `educational_content` / `profiles`, so even the correct publishable key could read
  `locked_payload`, `variants`, `file_url` and `body_markdown` directly.
- Remediation:
  1. Anon slot replaced with the real **publishable key**; secret moved to
     `SUPABASE_SERVICE_ROLE_KEY` (`.env.local`, gitignored).
  2. Migration `supabase/migrations/0010_remove_blanket_grants.sql`: `revoke all` from
     anon/authenticated on all 9 public tables, re-granted exactly the canonical
     column sets (`file_url`/`body_markdown` → authenticated only; `profiles` →
     authenticated only).
  3. `notify pgrst, 'reload schema';` — PostgREST does not reload its schema cache
     for GRANT/REVOKE (only CREATE/ALTER/DROP), so a manual reload was required.
  4. Verified: anon REST reads of `locked_payload`/`variants`/`file_url`/
     `body_markdown`/`profiles` → 401; metadata + hierarchy → 200.
- **Action required by owner:** rotate the leaked secret key in the Supabase
  dashboard (the `sb_secret_otLX…` value was pasted into this chat session and has
  been in the browser bundle since deployment). Generate a new secret key and update
  `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

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
