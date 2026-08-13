import { describe, expect, it } from "vitest";
import {
  canAccessContent,
  FOLDER_ACCESS_LEVEL,
  FOLDER_LABELS,
  FOLDER_TO_BLOCK_TYPE,
  isSectionVisible,
  SECTION_ORDER,
  sectionKeyForBlockType,
  sectionLabelForBlockType,
  sectionIndexForBlockType,
  viewerSectionLimit,
  validateAccessLevel,
} from "@/lib/access";
import { BLOCK_TYPE_STYLES, SUBJECT_CATALOGUE } from "@/lib/content-structure";
import type { AccessLevel } from "@/lib/types";

/**
 * Unit tests for the notes-architecture integration
 * (supabase/migrations/0005 + lib/access.ts + lib/content-structure.ts).
 *
 * The ravikishan reference file (NOTES_ARCHITECTURE_AND_SYLLABUS.md) defines:
 *   - the 11 canonical section taxonomy (append-only render order)
 *   - content degradation 15% -> 100% by viewer tier
 *   - the 8 authoring folders -> BlockType mapping + access tiers
 *   - per-subject icon + themeColor + subjectType catalogue
 * These tests lock that contract so future edits cannot silently break it.
 */

describe("section taxonomy (11 canonical sections)", () => {
  it("has exactly 11 sections in append-only order", () => {
    expect(SECTION_ORDER).toHaveLength(11);
    // The render-order contract is append-only — indices are stable.
    const keys = SECTION_ORDER.map((s) => s.key);
    expect(keys).toEqual([
      "topic",
      "learning",
      "diagram",
      "concept",
      "examples",
      "important",
      "mind_recall",
      "pyq",
      "solved",
      "premium",
      "references",
    ]);
  });

  it("sectionIndexForBlockType maps block types to their canonical index", () => {
    expect(sectionIndexForBlockType("note_topic")).toBe(0);
    expect(sectionIndexForBlockType("learning_outcome")).toBe(1);
    expect(sectionIndexForBlockType("mindmap")).toBe(2);
    expect(sectionIndexForBlockType("graph")).toBe(2);
    expect(sectionIndexForBlockType("note_concept")).toBe(3);
    expect(sectionIndexForBlockType("formula")).toBe(3);
    expect(sectionIndexForBlockType("note_example")).toBe(4);
    expect(sectionIndexForBlockType("note_important")).toBe(5);
    expect(sectionIndexForBlockType("keywords")).toBe(6);
    expect(sectionIndexForBlockType("pyq")).toBe(7);
    expect(sectionIndexForBlockType("solved_example")).toBe(8);
    expect(sectionIndexForBlockType("premium_expansion")).toBe(9);
    expect(sectionIndexForBlockType("reference")).toBe(10);
  });

  it("unknown block types fall back to index 0 (topic)", () => {
    expect(sectionIndexForBlockType("unknown-type")).toBe(0);
    expect(sectionIndexForBlockType(null)).toBe(0);
    expect(sectionIndexForBlockType(undefined)).toBe(0);
  });

  it("sectionKeyForBlockType / sectionLabelForBlockType follow the registry", () => {
    expect(sectionKeyForBlockType("pyq")).toBe("pyq");
    expect(sectionLabelForBlockType("pyq")).toBe("Past Year Questions");
    expect(sectionKeyForBlockType("formula")).toBe("concept");
    expect(sectionLabelForBlockType("note_concept")).toBe("Concept");
  });
});

describe("content degradation (15% -> 100%)", () => {
  it("viewerSectionLimit shrinks content by tier", () => {
    // Public (4) -> 1 section ≈ 15%; logged-in (3) -> 3 ≈ 25%;
    // member (2) -> 5 ≈ 50%; owner (1) -> all 11 ≈ 100%.
    expect(viewerSectionLimit(4)).toBe(1);
    expect(viewerSectionLimit(3)).toBe(3);
    expect(viewerSectionLimit(2)).toBe(5);
    expect(viewerSectionLimit(1)).toBe(10); // 11 sections, last index
    // Null (anonymous) degrades to the public limit (fail closed).
    expect(viewerSectionLimit(null)).toBe(1);
  });

  it("isSectionVisible requires both section limit AND block access tier", () => {
    // Public viewer: section 0 visible, section 4 hidden by degradation.
    expect(isSectionVisible(0, 4, 4)).toBe(true);
    expect(isSectionVisible(4, 4, 4)).toBe(false);
    // Block access tier still gates within the visible prefix.
    // Public (4) cannot read a tier-2 block even in section 0.
    expect(isSectionVisible(0, 2, 4)).toBe(false);
    // Owner can read everything.
    expect(isSectionVisible(10, 1, 1)).toBe(true);
  });
});

describe("authoring folder taxonomy (path = type)", () => {
  it("maps every ravikishan folder to a canonical BlockType", () => {
    expect(FOLDER_TO_BLOCK_TYPE.concepts).toBe("note_concept");
    expect(FOLDER_TO_BLOCK_TYPE.notes).toBe("note_important");
    expect(FOLDER_TO_BLOCK_TYPE.examples).toBe("note_example");
    expect(FOLDER_TO_BLOCK_TYPE.formula).toBe("formula");
    expect(FOLDER_TO_BLOCK_TYPE.pyqs).toBe("pyq");
    expect(FOLDER_TO_BLOCK_TYPE.sets).toBe("solved_example");
    expect(FOLDER_TO_BLOCK_TYPE.mindmap).toBe("mindmap");
    expect(FOLDER_TO_BLOCK_TYPE.graph).toBe("graph");
  });

  it("applies the mapped access tier (3 free -> 4, 2 member -> 2, 1 premium -> 1)", () => {
    // ravikishan 3 (free) -> our 4 (Public)
    expect(FOLDER_ACCESS_LEVEL.concepts).toBe(4);
    // ravikishan 2 (member) -> our 2 (Member)
    expect(FOLDER_ACCESS_LEVEL.notes).toBe(2);
    expect(FOLDER_ACCESS_LEVEL.examples).toBe(2);
    expect(FOLDER_ACCESS_LEVEL.pyqs).toBe(2);
    // ravikishan 1 (premium) -> our 1 (Owner)
    expect(FOLDER_ACCESS_LEVEL.formula).toBe(1);
    expect(FOLDER_ACCESS_LEVEL.sets).toBe(1);
    expect(FOLDER_ACCESS_LEVEL.mindmap).toBe(1);
    expect(FOLDER_ACCESS_LEVEL.graph).toBe(1);
  });

  it("every folder has a human label", () => {
    for (const key of ["concepts", "notes", "examples", "formula", "pyqs", "sets", "mindmap", "graph"]) {
      expect(FOLDER_LABELS[key]).toBeTruthy();
    }
  });
});

describe("subject catalogue mirror", () => {
  it("every academic subject in our DB slug has icon + themeColor + subjectType", () => {
    for (const slug of ["physics", "chemistry", "mathematics", "biology", "english", "nepali", "computer-science"]) {
      expect(SUBJECT_CATALOGUE[slug]).toBeTruthy();
      expect(SUBJECT_CATALOGUE[slug].icon).toBeTruthy();
      expect(SUBJECT_CATALOGUE[slug].themeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(SUBJECT_CATALOGUE[slug].subjectType).toBeTruthy();
    }
  });
});

describe("block type styles cover the canonical types", () => {
  it("every folder-derived block type has a style entry", () => {
    for (const bt of Object.values(FOLDER_TO_BLOCK_TYPE)) {
      expect(BLOCK_TYPE_STYLES[bt]).toBeTruthy();
    }
  });

  it("every section block type has a style entry", () => {
    for (const section of SECTION_ORDER) {
      for (const bt of section.blockTypes) {
        expect(BLOCK_TYPE_STYLES[bt]).toBeTruthy();
      }
    }
  });
});

describe("access helper consistency (regression)", () => {
  it("the original canAccessContent contract is unchanged", () => {
    const levels: AccessLevel[] = [1, 2, 3, 4];
    for (const userLevel of [1, 2, 3, 4, null] as const) {
      for (const required of levels) {
        expect(canAccessContent(userLevel, required)).toBe(
          userLevel !== null && required >= userLevel
        );
      }
    }
  });

  it("validateAccessLevel still accepts 1..4 only", () => {
    expect(validateAccessLevel(1)).toBe(true);
    expect(validateAccessLevel(4)).toBe(true);
    expect(validateAccessLevel(0)).toBe(false);
    expect(validateAccessLevel(5)).toBe(false);
  });
});