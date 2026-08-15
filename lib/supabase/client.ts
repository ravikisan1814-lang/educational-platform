import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_ANON_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

function requireEnv(name: string): string {
  const value = process.env[name];
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
    requireEnv(SUPABASE_URL),
    requireEnv(SUPABASE_ANON_KEY)
  );
}