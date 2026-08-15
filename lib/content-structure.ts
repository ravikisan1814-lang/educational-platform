// Content structure definitions for the platform.
//
// Part 1: the original class/section/subject catalogues.
// Part 2: the notes-architecture catalogue (from NOTES_ARCHITECTURE_AND_SYLLABUS.md):
//   - the 3-level syllabus color system (gold Unit / cyan Topic / violet Concept)
//   - per-block-type accent color + label + special-body renderer hints
//   - subject icon + themeColor catalogue (mirror of the ravikishan SUBJECTS map)
//   - the section-registry mirror (sectionLinks equivalent)

import {
  BLOCK_TYPE_LABELS,
  FOLDER_LABELS,
  SECTION_ORDER,
  type BlockTypeId,
} from "@/lib/access";

// ---------------------------------------------------------------------------
// Home catalogue — the 3 top-level sections shown on the home page.
//
//   Class 11  -> Class 11 notes, Class 11E, Class 11 more
//   Class 12  -> Class 12 notes, Class 12E, Class 12 more
//   Knowledge -> Loksewa knowledge, World knowledge
//
// Each sub-section maps to an exam-group slug (and optionally a subject slug)
// so the HomeExplorer can pull the matching content from /api/hierarchy.
// Outer navigation is NEVER locked — locks only appear inside content items.
// ---------------------------------------------------------------------------

export interface HomeSubSection {
  id: string;
  title: string;
  description: string;
  /** Exam-group slug this sub-section belongs to (e.g. "class-11", "loksewa"). */
  groupSlug: string;
  /** Optional subject slug to filter within the group (e.g. "notes"). */
  subjectSlug?: string;
}

export interface HomeSection {
  id: string;
  title: string;
  description: string;
  /** Exam-group slug this section maps to. */
  groupSlug: string;
  subSections: HomeSubSection[];
}

export const HOME_SECTIONS: HomeSection[] = [
  {
    id: "class-11",
    title: "Class 11",
    description: "NEB Class 11 curriculum — notes, English medium (E) and more.",
    groupSlug: "class-11",
    subSections: [
      {
        id: "class-11-notes",
        title: "Class 11 Notes",
        description: "Core Class 11 notes and study material.",
        groupSlug: "class-11",
        subjectSlug: "notes",
      },
      {
        id: "class-11e",
        title: "Class 11E",
        description: "English-medium Class 11 content.",
        groupSlug: "class-11e",
      },
      {
        id: "class-11-more",
        title: "Class 11 More",
        description: "Extended Class 11 topics and practice.",
        groupSlug: "class-11-more",
      },
    ],
  },
  {
    id: "class-12",
    title: "Class 12",
    description: "NEB Class 12 curriculum — notes, English medium (E) and more.",
    groupSlug: "class-12",
    subSections: [
      {
        id: "class-12-notes",
        title: "Class 12 Notes",
        description: "Core Class 12 notes and study material.",
        groupSlug: "class-12",
        subjectSlug: "notes",
      },
      {
        id: "class-12e",
        title: "Class 12E",
        description: "English-medium Class 12 content.",
        groupSlug: "class-12e",
      },
      {
        id: "class-12-more",
        title: "Class 12 More",
        description: "Extended Class 12 topics and practice.",
        groupSlug: "class-12-more",
      },
    ],
  },
  {
    id: "knowledge",
    title: "Knowledge",
    description: "Loksewa and general knowledge for competitive exams.",
    groupSlug: "loksewa",
    subSections: [
      {
        id: "loksewa",
        title: "Loksewa Knowledge",
        description: "Loksewa exam preparation material.",
        groupSlug: "loksewa",
      },
      {
        id: "general-knowledge",
        title: "World Knowledge",
        description: "General knowledge and world affairs.",
        groupSlug: "general-knowledge",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Notes-architecture catalogue (Part A of the ravikishan reference file)
// ---------------------------------------------------------------------------

/** 3-level syllabus color system — gold Unit / cyan Topic / violet Concept. */
export const STRUCTURE_COLORS = {
  chapter: "#fbbf24",
  topic: "#38bdf8",
  concept: "#a78bfa",
} as const;

export const STRUCTURE_LEGEND = [
  { symbol: "A", color: "#fbbf24", label: "Unit / Chapter" },
  { symbol: "1", color: "#38bdf8", label: "Topic" },
  { symbol: "i", color: "#a78bfa", label: "Concept" },
] as const;

/** Per-block-type accent color + label (BlockRenderer styles). */
export interface BlockStyle {
  color: string;
  label: string;
}

export const BLOCK_TYPE_STYLES: Record<string, BlockStyle> = {
  note_topic: { color: "#38bdf8", label: "Topic" },
  note_statement: { color: "#a78bfa", label: "Statement" },
  note_example: { color: "#fbbf24", label: "Example" },
  note_concept: { color: "#34d399", label: "Concept" },
  note_important: { color: "#fb7185", label: "Important" },
  numerical: { color: "#22d3ee", label: "Numerical" },
  mindmap: { color: "#818cf8", label: "Mind map" },
  diagram_compare: { color: "#2dd4bf", label: "Compare" },
  summary: { color: "#818cf8", label: "Summary" },
  keywords: { color: "#f59e0b", label: "Keywords" },
  important_points: { color: "#f97316", label: "Important points" },
  byakaran: { color: "#f43f5e", label: "Byakaran" },
  formula: { color: "#38bdf8", label: "Formula" },
  symbols: { color: "#c084fc", label: "Symbols" },
  learning_outcome: { color: "#4ade80", label: "Learning Outcomes" },
  mind_recall: { color: "#facc15", label: "Mind Recall" },
  pyq: { color: "#f87171", label: "Past Year Questions" },
  solved_example: { color: "#fb923c", label: "Solved Example" },
  premium_expansion: { color: "#e879f9", label: "Advanced Learning" },
  reference: { color: "#94a3b8", label: "Reference" },
  revision_summary: { color: "#34d399", label: "Revision Summary" },
  graph: { color: "#7dd3fc", label: "Graph" },
};

/** Special renderer hint per block type (QaSplit, chips, pills, ...). */
export const BLOCK_RENDERER_HINTS: Record<string, string> = {
  pyq: "qa",
  solved_example: "qa",
  numerical: "qa",
  keywords: "chips",
  important_points: "numbered",
  byakaran: "nested",
  formula: "pills",
  symbols: "table",
  mindmap: "mindmap",
  graph: "graph",
};

/** Subject icon + themeColor catalogue (mirror of ravikishan SUBJECTS). */
export interface SubjectCatalogueEntry {
  name: string;
  subjectType: string;
  icon: string;
  themeColor: string;
}

export const SUBJECT_CATALOGUE: Record<string, SubjectCatalogueEntry> = {
  physics: { name: "Physics", subjectType: "science_math", icon: "orbit", themeColor: "#38bdf8" },
  chemistry: { name: "Chemistry", subjectType: "science_math", icon: "flask", themeColor: "#34d399" },
  mathematics: { name: "Mathematics", subjectType: "science_math", icon: "ruler", themeColor: "#a78bfa" },
  biology: { name: "Biology", subjectType: "biology", icon: "dna", themeColor: "#2dd4bf" },
  english: { name: "English", subjectType: "english", icon: "book", themeColor: "#fbbf24" },
  nepali: { name: "Nepali", subjectType: "nepali", icon: "pen", themeColor: "#fb7185" },
  loksewa: { name: "Loksewa Knowledge", subjectType: "general_knowledge", icon: "scale", themeColor: "#f59e0b" },
  "general-knowledge": { name: "General Knowledge", subjectType: "general_knowledge", icon: "globe", themeColor: "#22d3ee" },
  "governance-public-admin": { name: "Governance & Public Admin", subjectType: "general_knowledge", icon: "scale", themeColor: "#f59e0b" },
  "nepal-geography": { name: "Nepal Geography", subjectType: "general_knowledge", icon: "globe", themeColor: "#22d3ee" },
  history: { name: "History", subjectType: "general_knowledge", icon: "globe", themeColor: "#22d3ee" },
  geography: { name: "Geography", subjectType: "general_knowledge", icon: "globe", themeColor: "#22d3ee" },
  "current-affairs": { name: "Current Affairs", subjectType: "general_knowledge", icon: "globe", themeColor: "#22d3ee" },
  "computer-science": { name: "Computer Science", subjectType: "computer_science", icon: "book", themeColor: "#94a3b8" },
};

/** All known type-folder keys (concepts, notes, examples, formula, ...). */
export const TYPE_FOLDER_KEYS = Object.keys(FOLDER_LABELS).filter((v, i, a) => a.indexOf(v) === i).sort();

// ---------------------------------------------------------------------------
// Section registry mirror (frontend mirror of the backend SECTION_ORDER)
// ---------------------------------------------------------------------------

export interface SectionLink {
  index: number;
  key: string;
  label: string;
  accessLevel: number;
}

export const SECTION_LINKS: SectionLink[] = SECTION_ORDER.map((s) => ({
  index: s.index,
  key: s.key,
  label: s.label,
  accessLevel: s.accessLevel,
}));

export const ALL_BLOCK_TYPE_IDS: BlockTypeId[] = Object.keys(BLOCK_TYPE_STYLES).sort() as BlockTypeId[];

export const BLOCK_TYPE_LABEL_MAP: Record<string, string> = BLOCK_TYPE_LABELS;