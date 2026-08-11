import type { AccessLevel } from "@/lib/types";

/**
 * Access-control helpers — the TypeScript mirror of the PostgreSQL RLS
 * predicate `required_access_level >= user.access_level`
 * (see supabase/migrations/0003_profiles_educational_content.sql).
 *
 * These are the single source of truth for API-layer lock decisions and
 * are covered by unit tests in tests/unit/access.test.ts.
 */

export function canAccessContent(
  userAccessLevel: AccessLevel | null,
  requiredAccessLevel: AccessLevel
): boolean {
  // Anonymous (or unknown) users have no profile row -> NULL in SQL -> false.
  if (userAccessLevel === null) return false;
  return requiredAccessLevel >= userAccessLevel;
}

export function isContentLockedFor(
  userAccessLevel: AccessLevel | null,
  requiredAccessLevel: AccessLevel
): boolean {
  return !canAccessContent(userAccessLevel, requiredAccessLevel);
}

/** Accepts exactly the integers 1..4. */
export function validateAccessLevel(value: unknown): value is AccessLevel {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 4
  );
}
