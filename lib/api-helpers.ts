import { createClient as createAdmin } from "@supabase/supabase-js";

/**
 * Server-only admin client using service role key.
 * BYPASSES RLS - use ONLY in route handlers, never in client components.
 */
export function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

/**
 * Clean error response helper
 */
export function handleError(error: unknown, defaultMessage = "Internal server error") {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error("[API Error]", message);
  return { error: message };
}

/**
 * paginated response helper
 */
export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    pagination: { page, limit, total, hasMore: page * limit < total },
  };
}
