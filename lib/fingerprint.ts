/**
 * Content fingerprinting — pure, dependency-free helpers used by the
 * ingestion pipeline (lib/ingestion.ts) for duplicate detection.
 *
 * Kept in a separate module so it can be unit-tested without pulling in
 * `server-only` or the Supabase admin client.
 */

/**
 * Deterministic fingerprint used to detect duplicate notes.
 * Normalizes case, punctuation, Devanagari, and drops words shorter than
 * 3 characters (stop-words), then sorts the remaining tokens.
 */
export function fingerprintNote(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .sort()
    .join(" ");
}