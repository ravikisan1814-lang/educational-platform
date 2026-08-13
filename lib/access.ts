import type { AccessLevel } from "@/lib/types";

/**
 * Access-control helpers — the TypeScript mirror of the PostgreSQL RLS
 * predicate `required_access_level >= user.access_level`
 * (see supabase/migrations/0003_profiles_educational_content.sql).
 *
 * These are the single source of truth for API-layer lock decisions and
 * are covered by unit tests in tests/unit/access.test.ts.
 *
 * Also the single source of truth for the NOTES-ARCHITECTURE block type /
 * section taxonomy (mirror of supabase/migrations/0005_notes_architecture_blocks.sql):
 * every content_item carries block_type, section_index, note_type and
 * metadata; the 11 canonical sections drive the render order and the
 * viewer content-degradation rule (15% -> 100%).
 */
// ---------------------------------------------------------------------------
// Access tiers in THIS platform (lower number = MORE access):
//   1 = Owner, 2 = Member, 3 = Co-member, 4 = Public.
// The ravikishan architecture uses the inverse numeric scale for its block
// access tiers (1 = premium, 2 = member, 3 = free). We map that to OUR
// AccessLevel union below so the existing RLS predicate is unchanged:
//   ravikishan 3 (free)     -> our 4 (Public)
//   ravikishan 2 (member)   -> our 2 (Member)
//   ravikishan 1 (premium)  -> our 1 (Owner)
// ---------------------------------------------------------------------------

/** Canonical 11-section render-order contract (append-only, never renumber). */
export interface SectionDefinition {
  index: number;
  key: string;
  label: string;
  blockTypes: string[];
  /** Our AccessLevel required to read blocks in this section (1..4). */
  accessLevel: AccessLevel;
}

export const SECTION_ORDER: SectionDefinition[] = [
  { index: 0, key: "topic", label: "Topic", blockTypes: ["note_topic"], accessLevel: 4 },
  { index: 1, key: "learning", label: "Learning Outcomes", blockTypes: ["learning_outcome"], accessLevel: 4 },
  { index: 2, key: "diagram", label: "Topic Diagram", blockTypes: ["mindmap", "graph", "diagram_compare"], accessLevel: 1 },
  { index: 3, key: "concept", label: "Concept", blockTypes: ["note_concept", "note_statement", "formula", "symbols", "byakaran"], accessLevel: 4 },
  { index: 4, key: "examples", label: "Examples", blockTypes: ["note_example", "numerical"], accessLevel: 2 },
  { index: 5, key: "important", label: "Important Points", blockTypes: ["note_important", "important_points"], accessLevel: 2 },
  { index: 6, key: "mind_recall", label: "Mind Recall", blockTypes: ["keywords", "mind_recall"], accessLevel: 1 },
  { index: 7, key: "pyq", label: "Past Year Questions", blockTypes: ["pyq"], accessLevel: 2 },
  { index: 8, key: "solved", label: "Solved Examples", blockTypes: ["solved_example"], accessLevel: 1 },
  { index: 9, key: "premium", label: "Advanced Learning", blockTypes: ["premium_expansion"], accessLevel: 1 },
  { index: 10, key: "references", label: "References", blockTypes: ["reference", "revision_summary", "summary"], accessLevel: 1 },
];

const SECTION_BY_INDEX = new Map(SECTION_ORDER.map((s) => [s.index, s]));
const SECTION_INDEX_BY_BLOCK_TYPE = new Map<string, number>();
for (const section of SECTION_ORDER) {
  for (const bt of section.blockTypes) SECTION_INDEX_BY_BLOCK_TYPE.set(bt, section.index);
}

export function sectionIndexForBlockType(blockType: string | null | undefined): number {
  if (blockType && SECTION_INDEX_BY_BLOCK_TYPE.has(blockType)) {
    return SECTION_INDEX_BY_BLOCK_TYPE.get(blockType)!;
  }
  return 0;
}

export function sectionKeyForBlockType(blockType: string | null | undefined): string {
  return SECTION_BY_INDEX.get(sectionIndexForBlockType(blockType))?.key ?? "topic";
}

export function sectionLabelForBlockType(blockType: string | null | undefined): string {
  return SECTION_BY_INDEX.get(sectionIndexForBlockType(blockType))?.label ?? "Topic";
}

/**
 * Content degradation — lower viewer tiers see fewer sections.
 *   Public (4)   -> 1 section  ≈ 15%
 *   Co-member (3)-> 3 sections ≈ 25%
 *   Member (2)   -> 5 sections ≈ 50%
 *   Owner (1)    -> all 11 sections ≈ 100%
 */
export function viewerSectionLimit(viewerLevel: AccessLevel | null): number {
  if (viewerLevel === null || viewerLevel >= 4) return 1;
  if (viewerLevel === 3) return 3;
  if (viewerLevel === 2) return 5;
  return SECTION_ORDER.length - 1;
}

/**
 * Whether a single block (by its section index + block access level) is
 * visible to a viewer. Mirrors the RLS predicate for in-section gating:
 *   sectionIndex <= viewerSectionLimit(viewer) AND
 *   item.access_level >= viewer.access_level
 */
export function isSectionVisible(
  sectionIndex: number | null | undefined,
  blockAccessLevel: AccessLevel,
  viewerLevel: AccessLevel | null
): boolean {
  const idx = sectionIndex ?? 0;
  return idx <= viewerSectionLimit(viewerLevel) && canAccessContent(viewerLevel, blockAccessLevel);
}

// ---------------------------------------------------------------------------
// Authoring folder taxonomy (path = type) — the import-time classifier.
//   <class>/<subject>/<chapter>/<typeFolder>/NN-name.json
// ---------------------------------------------------------------------------

export const FOLDER_TO_BLOCK_TYPE: Record<string, string> = {
  concept: "note_concept",
  concepts: "note_concept",
  note: "note_important",
  notes: "note_important",
  example: "note_example",
  examples: "note_example",
  formula: "formula",
  formulas: "formula",
  pyq: "pyq",
  pyqs: "pyq",
  set: "solved_example",
  sets: "solved_example",
  mindmap: "mindmap",
  mindmaps: "mindmap",
  "mind-map": "mindmap",
  graph: "graph",
  graphs: "graph",
  plot: "graph",
  plots: "graph",
  diagram: "graph",
  diagrams: "graph",
};

/**
 * Folder-level default access tier, mapped from the ravikishan 1/2/3 scale
 * onto OUR AccessLevel union (3=free->4, 2=member->2, 1=premium->1).
 */
export const FOLDER_ACCESS_LEVEL: Record<string, AccessLevel> = {
  concept: 4,
  concepts: 4,
  note: 2,
  notes: 2,
  example: 2,
  examples: 2,
  formula: 1,
  formulas: 1,
  pyq: 2,
  pyqs: 2,
  set: 1,
  sets: 1,
  mindmap: 1,
  mindmaps: 1,
  "mind-map": 1,
  graph: 1,
  graphs: 1,
  plot: 1,
  plots: 1,
  diagram: 1,
  diagrams: 1,
};

/** Human-friendly label for a type folder (used by the importer + UI chips). */
export const FOLDER_LABELS: Record<string, string> = {
  concepts: "Concepts",
  concept: "Concepts",
  notes: "Quick Notes",
  note: "Quick Notes",
  examples: "Worked Examples",
  example: "Worked Examples",
  formula: "Formulas",
  formulas: "Formulas",
  pyqs: "Past Year Questions",
  pyq: "Past Year Questions",
  sets: "Practice Sets",
  set: "Practice Sets",
  mindmap: "Mind Map",
  mindmaps: "Mind Map",
  "mind-map": "Mind Map",
  graph: "Graphs",
  graphs: "Graphs",
  plot: "Graphs",
  plots: "Graphs",
  diagram: "Graphs",
  diagrams: "Graphs",
};

/** Canonical BlockType ids used across the platform. */
export const BLOCK_TYPE_IDS = (
  Object.values(FOLDER_TO_BLOCK_TYPE)
    .filter((v, i, a) => a.indexOf(v) === i)
    .concat(SECTION_ORDER.flatMap((s) => s.blockTypes))
).filter((v, i, a) => a.indexOf(v) === i).sort();

export type BlockTypeId = (typeof BLOCK_TYPE_IDS)[number];

/** Human labels for every canonical block type. */
export const BLOCK_TYPE_LABELS: Record<string, string> = {
  note_topic: "Topic",
  note_statement: "Statement",
  note_example: "Example",
  note_concept: "Concept",
  note_important: "Important",
  numerical: "Numerical",
  mindmap: "Mind map",
  diagram_compare: "Compare",
  summary: "Summary",
  keywords: "Keywords",
  important_points: "Important points",
  byakaran: "Byakaran",
  formula: "Formula",
  symbols: "Symbols",
  learning_outcome: "Learning Outcomes",
  mind_recall: "Mind Recall",
  pyq: "Past Year Questions",
  solved_example: "Solved Example",
  premium_expansion: "Advanced Learning",
  reference: "Reference",
  revision_summary: "Revision Summary",
  graph: "Graph",
};

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
