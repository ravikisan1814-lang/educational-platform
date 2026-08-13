/**
 * Migration script: imports JSON content from the ravikishan project
 * (../ravikishan/migrated-content) into this platform's Supabase database.
 *
 * Folder structure -> hierarchy mapping:
 *   class-11|class-11e|class-12    -> exam_groups
 *   chemistry|physics|...          -> subjects
 *   unit-2-stoichiometry|...       -> chapters
 *   concepts|sets|examples|...     -> sub_chapters (content type)
 *   NN-name.json                   -> topics + content_items
 *
 * NOTES-ARCHITECTURE integration (supabase/migrations/0005 + lib/access.ts):
 *   * The type folder (4th path level) is classified via
 *     FOLDER_TO_BLOCK_TYPE into a canonical BlockType id.
 *   * section_index is computed from the canonical 11-section taxonomy.
 *   * access_level is mapped from the ravikishan 1/2/3 tier onto OUR
 *     AccessLevel union (3 free -> 4 Public, 2 member -> 2 Member,
 *     1 premium -> 1 Owner).
 *   * note_type + metadata (sourceKey, contentType, classifiedBy, order,
 *     contentHash) are stored on each content_item.
 *
 * Usage:
 *   node scripts/migrate-content.mjs
 *
 * Requires env vars (set in .env.local or shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   MIGRATE_SOURCE_DIR  (optional, defaults to ../ravikishan/migrated-content)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// 1. Environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOURCE_DIR = process.env.MIGRATE_SOURCE_DIR ?? join(projectRoot, "..", "ravikishan", "migrated-content");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing required env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!existsSync(SOURCE_DIR)) {
  console.error(`Source directory not found: ${SOURCE_DIR}`);
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Notes-architecture classification (mirror of lib/access.ts minus imports)
// ---------------------------------------------------------------------------

// ravikishan block access tier -> OUR AccessLevel union (1..4, lower = more access)
const TAB_TO_ACCESS_LEVEL = {
  concept: 4,  // ravikishan 3 free -> our Public(4)
  note: 2,     // ravikishan 2 member -> our Member(2)
  example: 2,
  formula: 1,  // ravikishan 1 premium -> our Owner(1)
  pyq: 2,
  set: 1,
  mindmap: 1,
  graph: 1,
};

const FOLDER_TO_BLOCK_TYPE = {
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

// Canonical 11-section render order (same contract as lib/access.ts)
const SECTION_ORDER = [
  { index: 0, key: "topic", label: "Topic", blockTypes: ["note_topic"] },
  { index: 1, key: "learning", label: "Learning Outcomes", blockTypes: ["learning_outcome"] },
  { index: 2, key: "diagram", label: "Topic Diagram", blockTypes: ["mindmap", "graph", "diagram_compare"] },
  { index: 3, key: "concept", label: "Concept", blockTypes: ["note_concept", "note_statement", "formula", "symbols", "byakaran"] },
  { index: 4, key: "examples", label: "Examples", blockTypes: ["note_example", "numerical"] },
  { index: 5, key: "important", label: "Important Points", blockTypes: ["note_important", "important_points"] },
  { index: 6, key: "mind_recall", label: "Mind Recall", blockTypes: ["keywords", "mind_recall"] },
  { index: 7, key: "pyq", label: "Past Year Questions", blockTypes: ["pyq"] },
  { index: 8, key: "solved", label: "Solved Examples", blockTypes: ["solved_example"] },
  { index: 9, key: "premium", label: "Advanced Learning", blockTypes: ["premium_expansion"] },
  { index: 10, key: "references", label: "References", blockTypes: ["reference", "revision_summary", "summary"] },
];
const SECTION_INDEX_BY_BLOCK_TYPE = new Map();
for (const section of SECTION_ORDER) {
  for (const bt of section.blockTypes) SECTION_INDEX_BY_BLOCK_TYPE.set(bt, section.index);
}

const TYPE_LABELS = { concepts: "Concepts", sets: "Practice Sets", examples: "Worked Examples", formula: "Formulas", mindmap: "Mind Map", notes: "Quick Notes", pyqs: "Past Year Questions", graph: "Graphs" };

function canonicalTypeFolder(folder) {
  return FOLDER_TO_BLOCK_TYPE[folder] ? folder : null;
}

function blockTypeForFolder(folder) {
  return FOLDER_TO_BLOCK_TYPE[folder] ?? "note_concept";
}

function sectionIndexForBlockType(blockType) {
  return SECTION_INDEX_BY_BLOCK_TYPE.get(blockType) ?? 0;
}

function contentHash(notes) {
  return createHash("sha256").update(JSON.stringify(notes)).digest("hex").slice(0, 16);
}

// 2. Helpers
function collectJsonFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) results.push(...collectJsonFiles(full));
    else if (entry.endsWith(".json")) results.push(full);
  }
  return results;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}

function notesToHtml(title, notes) {
  const body = (notes ?? []).map((line) => {
    const t = line.trim();
    if (!t) return "";
    if (t.startsWith("### ")) return `<h4>${t.slice(4)}</h4>`;
    if (t.startsWith("## ")) return `<h3>${t.slice(3)}</h3>`;
    if (t.startsWith("# ")) return `<h2>${t.slice(2)}</h2>`;
    if (/^[-*•]\s+/.test(t)) return `<li>${t.replace(/^[-*•]\s+/, "")}</li>`;
    if (/^\d+[.)]\s+/.test(t)) return `<li>${t.replace(/^\d+[.)]\s+/, "")}</li>`;
    const bold = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return `<p>${bold.replace(/`(.+?)`/g, "<code>$1</code>")}</p>`;
  }).join("");
  return `<h3>${title}</h3>${body}`;
}

function buildTeaser(title, notes) {
  const first = (notes ?? []).find((n) => n.trim().length > 0);
  if (!first) return `<p>Open concept for ${title}: a short, free introduction.</p>`;
  const clean = first.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`(.+?)`/g, "$1").replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").slice(0, 200);
  return `<p>${clean}${clean.length >= 200 ? "…" : ""}</p>`;
}

// 3. Hierarchy upsert helpers
async function upsert(table, row, conflict) {
  const { data, error } = await admin.from(table).upsert(row, { onConflict: conflict }).select("id").single();
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  return data.id;
}

async function main() {
  console.log(`\n=== Content Migration ===`);
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Target: ${SUPABASE_URL}\n`);

  const jsonFiles = collectJsonFiles(SOURCE_DIR);
  console.log(`Found ${jsonFiles.length} JSON files.\n`);

  const stats = { examGroups: 0, subjects: 0, chapters: 0, subChapters: 0, topics: 0, contentItems: 0, skipped: 0, errors: [] };
  const blockTypeCounts = {};

  // Group files: class -> subject -> unit -> type -> files
  const groups = new Map();
  for (const file of jsonFiles) {
    const rel = relative(SOURCE_DIR, file);
    const parts = rel.split(/[\\/]/);
    if (parts.length < 5) { console.warn(`  SKIP (unexpected depth): ${rel}`); stats.skipped++; continue; }
    const [classSlug, subjectSlug, unitSlug, typeSlug, fileName] = parts;
    if (!groups.has(classSlug)) groups.set(classSlug, { name: classSlug, subjects: new Map() });
    const cls = groups.get(classSlug);
    if (!cls.subjects.has(subjectSlug)) cls.subjects.set(subjectSlug, { name: subjectSlug, units: new Map() });
    const subj = cls.subjects.get(subjectSlug);
    if (!subj.units.has(unitSlug)) subj.units.set(unitSlug, { name: unitSlug, types: new Map() });
    const unit = subj.units.get(unitSlug);
    if (!unit.types.has(typeSlug)) unit.types.set(typeSlug, []);
    unit.types.get(typeSlug).push({ file, fileName, rel });
  }

  for (const [classSlug, cls] of groups) {
    const classLabel = classSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const examGroupId = await upsert("exam_groups", { slug: classSlug, name: classLabel, description: `${classLabel} curriculum content.`, sort_order: classSlug === "class-11" ? 1 : classSlug === "class-11e" ? 2 : 3 }, "slug");
    stats.examGroups++;
    console.log(`\n[Exam Group] ${classLabel}`);

    let subjectOrder = 0;
    for (const [subjectSlug, subj] of cls.subjects) {
      subjectOrder++;
      const subjectLabel = subjectSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const subjectId = await upsert("subjects", { exam_group_id: examGroupId, slug: subjectSlug, name: subjectLabel, description: `${subjectLabel} for ${classLabel}.`, sort_order: subjectOrder }, "exam_group_id,slug");
      stats.subjects++;
      console.log(`  [Subject] ${subjectLabel}`);

      let chapterOrder = 0;
      for (const [unitSlug, unit] of subj.units) {
        chapterOrder++;
        const chapterLabel = unitSlug.replace(/^unit-\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const chapterId = await upsert("chapters", { subject_id: subjectId, slug: unitSlug, name: chapterLabel, description: `${chapterLabel} — ${subjectLabel} unit.`, sort_order: chapterOrder }, "subject_id,slug");
        stats.chapters++;
        console.log(`    [Chapter] ${chapterLabel}`);

        let typeOrder = 0;
        for (const [typeSlug, files] of unit.types) {
          typeOrder++;
          const typeLabel = TYPE_LABELS[typeSlug] ?? typeSlug;
          const subChapterId = await upsert("sub_chapters", { chapter_id: chapterId, slug: typeSlug, name: typeLabel, description: `${typeLabel} for ${chapterLabel}.`, sort_order: typeOrder }, "chapter_id,slug");
          stats.subChapters++;
          console.log(`      [Sub-Chapter] ${typeLabel}`);

          let topicOrder = 0;
          for (const { file, fileName, rel } of files) {
            topicOrder++;
            try {
              const raw = JSON.parse(readFileSync(file, "utf8"));
              const title = raw.title ?? basename(fileName, ".json");
              const notes = Array.isArray(raw.notes) ? raw.notes : [];
              const topicSlug = slugify(basename(fileName, ".json"));
              const topicName = title.length > 80 ? title.slice(0, 80) + "…" : title;

              // Notes-architecture classification
              const canonicalFolder = canonicalTypeFolder(typeSlug);
              const blockType = blockTypeForFolder(typeSlug);
              const sectionIndex = sectionIndexForBlockType(blockType);
              const accessLevel = (canonicalFolder && TAB_TO_ACCESS_LEVEL[canonicalFolder]) || 4;
              const noteType = (typeof raw.noteType === "number" && raw.noteType >= 1 && raw.noteType <= 99) ? raw.noteType : 1;
              const h = contentHash(notes);

              const topicId = await upsert("topics", { sub_chapter_id: subChapterId, slug: topicSlug, name: topicName, description: null, sort_order: topicOrder }, "sub_chapter_id,slug");
              stats.topics++;

              const payload = notesToHtml(title, notes);
              const teaser = buildTeaser(title, notes);
              const variants = [];
              if (raw.latex) variants.push({ label: "LaTeX", interface: "latex", content: `<h3>${title} — LaTeX</h3>${notes.map((n) => `<p>${n}</p>`).join("")}` });
              if (raw.year || raw.examSource) variants.push({ label: "Exam Info", interface: "exam", content: `<h3>${title} — Exam Info</h3><p>Year: ${raw.year ?? "N/A"}<br/>Source: ${raw.examSource ?? "N/A"}</p>` });
              if (raw.graph) variants.push({ label: "Graph", interface: "graph", content: `<h3>${title} — Graph</h3><pre>${JSON.stringify(raw.graph, null, 2)}</pre>` });

              const metadata = {
                sourceKey: rel,
                contentType: blockType,
                classifiedBy: "auto",
                classifiedConfidence: canonicalFolder ? 1.0 : 0.7,
                classifiedReason: canonicalFolder ? `folder=${typeSlug}` : "heuristics",
                order: raw.order ?? null,
                contentHash: h,
              };

              await upsert("content_items", {
                topic_id: topicId,
                title,
                access_level: accessLevel,
                owner_contact: "ravikisan1814@gmail.com",
                public_teaser: teaser,
                locked_payload: payload,
                variants,
                block_type: blockType,
                section_index: sectionIndex,
                note_type: noteType,
                metadata,
              }, "topic_id,title");
              stats.contentItems++;
              blockTypeCounts[blockType] = (blockTypeCounts[blockType] ?? 0) + 1;
              console.log(`        [Topic] ${topicName} (${blockType}, section ${sectionIndex}, tier ${accessLevel})`);
            } catch (err) {
              stats.errors.push(`${rel}: ${err.message}`);
              console.error(`        ERROR ${rel}: ${err.message}`);
            }
          }
        }
      }
    }
  }

  console.log(`\n=== Migration Summary ===`);
  console.log(`Exam groups:   ${stats.examGroups}`);
  console.log(`Subjects:      ${stats.subjects}`);
  console.log(`Chapters:      ${stats.chapters}`);
  console.log(`Sub-chapters:  ${stats.subChapters}`);
  console.log(`Topics:        ${stats.topics}`);
  console.log(`Content items: ${stats.contentItems}`);
  console.log(`Skipped:       ${stats.skipped}`);
  console.log(`\nBlock-type breakdown:`);
  for (const [bt, count] of Object.entries(blockTypeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${bt}: ${count}`);
  }
  if (stats.errors.length > 0) {
    console.log(`\nErrors (${stats.errors.length}):`);
    for (const e of stats.errors) console.log(`  - ${e}`);
  }
  console.log(`\nMigration complete!`);
}

main().catch((err) => { console.error("\nFATAL:", err); process.exit(1); });