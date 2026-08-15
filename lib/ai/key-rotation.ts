/**
 * Multi-key rotation for free-tier AI providers.
 *
 * Each provider can be configured with a primary key plus up to 9 numbered
 * fallback keys (e.g. GEMINI_API_KEY, GEMINI_API_KEY_2, ... GEMINI_API_KEY_10).
 * This lets the platform spread quota across multiple free-tier accounts.
 *
 * Keys are rotated round-robin on every request so no single account is
 * hammered. If a key fails (rate limit / 5xx), the provider's generate()
 * throws and the caller (lib/ai/index.ts) falls through to the next provider
 * — and the next request will use the next key in the rotation.
 */

const MAX_ROTATION_KEYS = 10;

/** Collect all configured keys for an env prefix (primary + numbered). */
export function getRotatingKeys(envPrefix: string): string[] {
  const keys: string[] = [];
  const primary = process.env[envPrefix];
  if (primary) keys.push(primary);
  for (let i = 2; i <= MAX_ROTATION_KEYS; i++) {
    const k = process.env[`${envPrefix}_${i}`];
    if (k) keys.push(k);
  }
  return keys;
}

let rotationCursor = 0;

/** Pick the next key round-robin. Returns "" when no keys are configured. */
export function nextRotatingKey(keys: string[]): string {
  if (keys.length === 0) return "";
  const key = keys[rotationCursor % keys.length];
  rotationCursor += 1;
  return key;
}
