import { describe, expect, it } from "vitest";
import { canAccessContent, isContentLockedFor, validateAccessLevel } from "@/lib/access";
import { ACCESS_LEVEL_LABELS, maskedTitle } from "@/lib/types";
import type { AccessLevel } from "@/lib/types";

const LEVELS = [1, 2, 3, 4] as const;

/**
 * Unit tests for the access-control decision logic.
 *
 * These mirror the PostgreSQL RLS predicate enforced on
 * `educational_content` (access_level >= current_access_level())
 * in supabase/migrations/0003_profiles_educational_content.sql.
 * Lower numbers = more access: 1=Owner, 2=Member, 3=Co-member, 4=Public.
 */

describe("canAccessContent", () => {
  it("Owner (1) can read every tier (1, 2, 3, 4)", () => {
    for (const required of LEVELS) {
      expect(canAccessContent(1, required)).toBe(true);
    }
  });

  it("Member (2) can read tiers 2, 3, 4 but NOT Owner-only (1)", () => {
    expect(canAccessContent(2, 1)).toBe(false);
    for (const required of [2, 3, 4] as const) {
      expect(canAccessContent(2, required)).toBe(true);
    }
  });

  it("Co-member (3) can read tiers 3, 4 but NOT 1 or 2", () => {
    expect(canAccessContent(3, 1)).toBe(false);
    expect(canAccessContent(3, 2)).toBe(false);
    expect(canAccessContent(3, 3)).toBe(true);
    expect(canAccessContent(3, 4)).toBe(true);
  });

  it("Public (4) can read ONLY free content (tier 4)", () => {
    expect(canAccessContent(4, 4)).toBe(true);
  });

  it("REQUIREMENT: Public (4) CANNOT read raw Level 1, 2 or 3 content", () => {
    expect(canAccessContent(4, 1)).toBe(false);
    expect(canAccessContent(4, 2)).toBe(false);
    expect(canAccessContent(4, 3)).toBe(false);
  });

  it("anonymous (null) cannot read any tiered content — fail closed", () => {
    for (const required of LEVELS) {
      expect(canAccessContent(null, required)).toBe(false);
    }
  });

  it("matches the RLS predicate exactly: required >= user for every pair", () => {
    for (const userLevel of [1, 2, 3, 4] as const) {
      for (const required of LEVELS) {
        expect(canAccessContent(userLevel, required)).toBe(required >= userLevel);
      }
    }
  });
});

describe("isContentLockedFor", () => {
  it("is locked exactly when the content is not accessible", () => {
    for (const userLevel of [1, 2, 3, 4, null] as const) {
      for (const required of LEVELS) {
        expect(isContentLockedFor(userLevel, required)).toBe(
          !canAccessContent(userLevel, required)
        );
      }
    }
  });

  it("anonymous users see every item as locked", () => {
    for (const required of LEVELS) {
      expect(isContentLockedFor(null, required)).toBe(true);
    }
  });

  it("Public (4) sees tier 1-3 items as locked but tier 4 as open", () => {
    expect(isContentLockedFor(4, 1)).toBe(true);
    expect(isContentLockedFor(4, 2)).toBe(true);
    expect(isContentLockedFor(4, 3)).toBe(true);
    expect(isContentLockedFor(4, 4)).toBe(false);
  });

  it("Owner (1) sees nothing as locked", () => {
    for (const required of LEVELS) {
      expect(isContentLockedFor(1, required)).toBe(false);
    }
  });
});

describe("validateAccessLevel", () => {
  it("accepts exactly the integers 1 through 4", () => {
    expect(validateAccessLevel(1)).toBe(true);
    expect(validateAccessLevel(2)).toBe(true);
    expect(validateAccessLevel(3)).toBe(true);
    expect(validateAccessLevel(4)).toBe(true);
  });

  it("rejects out-of-range, non-integer and non-numeric values", () => {
    expect(validateAccessLevel(0)).toBe(false);
    expect(validateAccessLevel(5)).toBe(false);
    expect(validateAccessLevel(-1)).toBe(false);
    expect(validateAccessLevel(2.5)).toBe(false);
    expect(validateAccessLevel("2")).toBe(false);
    expect(validateAccessLevel(null)).toBe(false);
    expect(validateAccessLevel(undefined)).toBe(false);
    expect(validateAccessLevel(NaN)).toBe(false);
  });
});

describe("API lock metadata helpers", () => {
  it("every tier has a human-readable label", () => {
    const levels: AccessLevel[] = [1, 2, 3, 4];
    for (const level of levels) {
      expect(ACCESS_LEVEL_LABELS[level]).toBeTruthy();
    }
    expect(ACCESS_LEVEL_LABELS[1]).toBe("Owner");
    expect(ACCESS_LEVEL_LABELS[2]).toBe("Member");
    expect(ACCESS_LEVEL_LABELS[3]).toBe("Co-member");
    expect(ACCESS_LEVEL_LABELS[4]).toBe("Public");
  });

  it("masked titles carry the tier requirement (no raw title leak)", () => {
    expect(maskedTitle(1)).toContain("Owner");
    expect(maskedTitle(2)).toContain("Member");
    expect(maskedTitle(3)).toContain("Co-member");
    expect(maskedTitle(4)).toContain("Public");
  });
});
