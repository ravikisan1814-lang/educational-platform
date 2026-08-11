/**
 * Backward-compatible re-export.
 *
 * Server-side (route handlers / server components) code should import from
 * `@/lib/supabase/server` directly. This barrel keeps older imports working.
 */
export { createClient } from "@/lib/supabase/server";