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
// Original catalogues
// ---------------------------------------------------------------------------

export interface Subject {
  name: string;
  slug: string;
  description: string;
}

export interface ClassSection {
  id: string;
  title: string;
  description: string;
}

export interface ContentBlockType {
  id: string;
  label: string;
  description: string;
}

export const SUBJECTS: Subject[] = [
  { name: "Biology", slug: "biology", description: "Life sciences, cell biology, genetics, and ecology." },
  { name: "Chemistry", slug: "chemistry", description: "Physical, organic, and inorganic chemistry." },
  { name: "English", slug: "english", description: "Grammar, literature, and composition." },
  { name: "Mathematics", slug: "mathematics", description: "Algebra, calculus, geometry, and statistics." },
  { name: "Nepali", slug: "nepali", description: "Nepali language, literature, and grammar." },
  { name: "Physics", slug: "physics", description: "Mechanics, waves, electricity, and modern physics." },
  { name: "Computer Science", slug: "computer-science", description: "Programming, databases, and computer fundamentals." },
];

export const CLASS_11_SECTIONS: ClassSection[] = [
  { id: "class-11", title: "Class 11", description: "Core Class 11 curriculum." },
  { id: "class-11-more", title: "Class 11 More", description: "Extended Class 11 topics and practice." },
  { id: "class-11-extra", title: "Class 11 Extra", description: "Additional Class 11 resources and past papers." },
];

export const CLASS_12_SECTIONS: ClassSection[] = [
  { id: "class-12", title: "Class 12", description: "Core Class 12 curriculum." },
  { id: "class-12-more", title: "Class 12 More", description: "Extended Class 12 topics and practice." },
  { id: "class-12-extra", title: "Class 12 Extra", description: "Additional Class 12 resources and past papers." },
];

export const CONTENT_BLOCKS: ContentBlockType[] = [
  { id: "note", label: "Note", description: "Detailed topic notes." },
  { id: "topic", label: "Topic", description: "Topic overview and outline." },
  { id: "mind-map", label: "Mind-map", description: "Visual mind-map of the topic." },
  { id: "conceptual-points", label: "Conceptual Points", description: "Key concepts explained." },
  { id: "examples", label: "Examples", description: "Worked examples." },
  { id: "bullet-points", label: "Bullet Points", description: "Quick revision bullet points." },
  { id: "past-year-questions", label: "Past Year Questions", description: "Previous exam questions with answers." },
  { id: "mcqs", label: "MCQs", description: "Multiple choice questions." },
  { id: "short-questions", label: "Short Questions", description: "Short answer questions." },
  { id: "long-questions", label: "Long Questions", description: "Long answer questions." },
  { id: "numericals", label: "Numericals", description: "Numerical problems with solutions." },
  { id: "formulas", label: "Formulas", description: "Important formulas." },
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