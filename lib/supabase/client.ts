import { createBrowserClient } from "@supabase/ssr";

/**
 * Statically-analyzable env reads: Next.js only inlines
 * `process.env.NEXT_PUBLIC_*` accesses with a literal key. A dynamic
 * `process.env[name]` is NOT inlined and resolves to an empty object in the
 * browser bundle — which turns into a confusing runtime error.
 */
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

/**
 * Supabase client for browser-side code (client components, event handlers).
 * Uses the anon key + the user's session cookies, so all queries are
 * subject to RLS. Never use this in server components or route handlers.
 */
export function createClient() {
  return createBrowserClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", NEXT_PUBLIC_SUPABASE_URL),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}