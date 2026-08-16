/**
 * One-shot owner bootstrap (local only).
 *
 * Usage:
 *   node scripts/bootstrap-owner.mjs
 *
 * Reads OWNER_EMAIL + OWNER_PASSWORD from env (or defaults below), plus
 * NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.
 * Creates/updates the auth user, sets password, and marks the profile as
 * Owner (access_level=1, status=approved). Prints only status — never the password.
 *
 * To bootstrap multiple owners, set MULTI_OWNERS to a JSON array of
 * {email, password} objects, or run the script multiple times with
 * OWNER_EMAIL/OWNER_PASSWORD overrides.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

function loadEnv() {
  const env = { ...process.env };
  if (!existsSync(envPath)) return env;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in env) || env[k] === undefined || env[k] === "") env[k] = v;
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function parseOwners(env) {
  const multi = env.MULTI_OWNERS;
  if (multi) {
    try {
      const parsed = JSON.parse(multi);
      if (Array.isArray(parsed)) {
        return parsed.filter((o) => o && typeof o.email === "string" && typeof o.password === "string");
      }
    } catch {
      // fall through to single owner
    }
  }
  const email = (env.OWNER_EMAIL ?? "ravikisan1814@gmail.com").toLowerCase();
  const password = env.OWNER_PASSWORD;
  if (!password || password.length < 6) {
    console.error("Set OWNER_PASSWORD in .env.local (min 6 chars) before running.");
    process.exit(1);
  }
  return [{ email, password }];
}

async function findUserIdByEmail(target) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (hit) return hit.id;
    if (data.users.length < 100) return null;
    page += 1;
  }
}

async function ensureOwner({ email, password }) {
  let userId = await findUserIdByEmail(email);

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created owner auth user: ${email}`);
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`Updated owner password: ${email}`);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      access_level: 1,
      status: "approved",
      role: "owner",
    },
    { onConflict: "id" }
  );
  if (profileError) throw profileError;

  console.log(`Owner profile set: ${email} (access_level=1, status=approved)`);
}

async function main() {
  const owners = parseOwners(env);
  for (const owner of owners) {
    await ensureOwner(owner);
  }
  console.log(`\nBootstrapped ${owners.length} owner(s).`);
  console.log(`Sign in at /login with one of the owner emails.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
