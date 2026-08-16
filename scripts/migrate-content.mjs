/**
 * Migration script: imports JSON content from the ravikishan project
 * (../ravikishan/migrated-content) into this platform's Supabase database.
 *
 * Target: academic-core exam group (pre-seeded by migration 0004).
 *
 * Folder structure -> hierarchy mapping:
 *   class-11|class-11e|class-12  -> source folders (all merged into academic-core)
 *   chemistry|physics|...         -> subjects (matched to existing subjects)
 *   unit-2-stoichiometry|...      -> chapters
 *   concepts|sets|examples|...    -> sub_chapters (content type)
 *   NN-name.json                  -> topics + content_items
 *
 * Usage:
 *   node scripts/migrate-content.mjs
 *
 * Requires env vars (set in .env.local or shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   MIGRATE_SOURCE_DIR       (optional, defaults to ../ravikishan/migrated-content)
 *   MIGRATE_TARGET_EXAM_GROUP (optional, default academic-core)
 *   MIGRATE_SOURCE_CLASSES   (optional, comma-separated, default class-11,class-11e,class-12)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const envPath = join(projectRoot, ".env.local");

function loadEnv() {
  const env = { ...process.env };
  if (!existsSync(envPath)) return env;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in env) || !env[k]) env[k] = v;
  }
  return env;
}

const env = loadEnv();

// 1. Environment
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const SOURCE_DIR = env.MIGRATE_SOURCE_DIR ?? join(projectRoot, "..", "ravikishan", "migrated-content");
const TARGET_EXAM_GROUP = env.MIGRATE_TARGET_EXAM_GROUP ?? "class-11";
const SOURCE_CLASSES = (env.MIGRATE_SOURCE_CLASSES ?? "class-11,class-11e,class-12")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const SUBJECT_MAP = {
  physics: "physics",
  chemistry: "chemistry",
  mathematics: "mathematics",
  biology: "biology",
  english: "english",
  nepali: "nepali",
  "computer-science": "computer-science",
};

const TYPE_LABELS = {
  concepts: "Concepts",
  sets: "Practice Sets",
  examples: "Worked Examples",
  formula: "Formulas",
  mindmap: "Mind Map",
  notes: "Quick Notes",
  pyqs: "Past Year Questions",
  graph: "Graphs",
};

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

async function getExamGroupId(slug) {
  const { data, error } = await admin.from("exam_groups").select("id").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to fetch exam group ${slug}: ${error.message}`);
  return data?.id ?? null;
}

async function getSubjectId(examGroupId, slug) {
  const { data, error } = await admin.from("subjects").select("id").eq("exam_group_id", examGroupId).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to fetch subject ${slug}: ${error.message}`);
  return data?.id ?? null;
}

async function getChapterId(subjectId, slug) {
  const { data, error } = await admin.from("chapters").select("id").eq("subject_id", subjectId).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to fetch chapter ${slug}: ${error.message}`);
  return data?.id ?? null;
}

async function getSubChapterId(chapterId, slug) {
  const { data, error } = await admin.from("sub_chapters").select("id").eq("chapter_id", chapterId).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to fetch sub-chapter ${slug}: ${error.message}`);
  return data?.id ?? null;
}

async function getTopicId(subChapterId, slug) {
  const { data, error } = await admin.from("topics").select("id").eq("sub_chapter_id", subChapterId).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to fetch topic ${slug}: ${error.message}`);
  return data?.id ?? null;
}

async function main() {
  console.log(`\n=== Content Migration ===`);
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Target exam group: ${TARGET_EXAM_GROUP}`);
  console.log(`Source classes: ${SOURCE_CLASSES.join(", ")}`);
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  const examGroupId = await getExamGroupId(TARGET_EXAM_GROUP);
  if (!examGroupId) {
    console.error(`Exam group "${TARGET_EXAM_GROUP}" not found. Seed it first via migrations.`);
    process.exit(1);
  }
  console.log(`Target exam group id: ${examGroupId}`);

  const jsonFiles = collectJsonFiles(SOURCE_DIR);
  console.log(`Found ${jsonFiles.length} JSON files total.\n`);

  const stats = { subjects: 0, chapters: 0, subChapters: 0, topics: 0, contentItems: 0, skipped: 0, errors: [] };

  // Group files: sourceClass -> subject -> unit -> type -> files
  const groups = new Map();
  for (const file of jsonFiles) {
    const rel = relative(SOURCE_DIR, file);
    const parts = rel.split(/[\\/]/);
    if (parts.length < 5) { console.warn(`  SKIP (unexpected depth): ${rel}`); stats.skipped++; continue; }
    const [classSlug, subjectSlug, unitSlug, typeSlug, fileName] = parts;
    if (!SOURCE_CLASSES.includes(classSlug)) continue;
    const mappedSubject = SUBJECT_MAP[subjectSlug];
    if (!mappedSubject) { console.warn(`  SKIP (unknown subject): ${rel}`); stats.skipped++; continue; }
    if (!groups.has(mappedSubject)) groups.set(mappedSubject, { units: new Map() });
    const subj = groups.get(mappedSubject);
    if (!subj.units.has(unitSlug)) subj.units.set(unitSlug, { types: new Map() });
    const unit = subj.units.get(unitSlug);
    if (!unit.types.has(typeSlug)) unit.types.set(typeSlug, []);
    unit.types.get(typeSlug).push({ file, fileName, rel, sourceClass: classSlug });
  }

  for (const [subjectSlug, subj] of groups) {
    const subjectId = await getSubjectId(examGroupId, subjectSlug);
    if (!subjectId) {
      console.warn(`  SKIP (subject not found in ${TARGET_EXAM_GROUP}): ${subjectSlug}`);
      stats.skipped++;
      continue;
    }
    stats.subjects++;
    console.log(`\n[Subject] ${subjectSlug}`);

    for (const [unitSlug, unit] of subj.units) {
      const chapterSlug = unitSlug;
      const chapterName = unitSlug.replace(/^unit-\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const chapterId = await getChapterId(subjectId, chapterSlug) || await upsert("chapters", { subject_id: subjectId, slug: chapterSlug, name: chapterName, description: `${chapterName} — ${subjectSlug}.`, sort_order: 0 }, "subject_id,slug");
      stats.chapters++;
      console.log(`  [Chapter] ${chapterName}`);

      for (const [typeSlug, files] of unit.types) {
        const typeLabel = TYPE_LABELS[typeSlug] ?? typeSlug;
        const subChapterId = await getSubChapterId(chapterId, typeSlug) || await upsert("sub_chapters", { chapter_id: chapterId, slug: typeSlug, name: typeLabel, description: `${typeLabel} for ${chapterName}.`, sort_order: 0 }, "chapter_id,slug");
        stats.subChapters++;
        console.log(`    [Sub-Chapter] ${typeLabel}`);

        for (const { file, fileName, rel } of files) {
          try {
            const raw = JSON.parse(readFileSync(file, "utf8"));
            const title = raw.title ?? basename(fileName, ".json");
            const notes = Array.isArray(raw.notes) ? raw.notes : [];
            const topicSlug = slugify(basename(fileName, ".json"));
            const topicName = title.length > 80 ? title.slice(0, 80) + "…" : title;

            const topicId = await getTopicId(subChapterId, topicSlug) || await upsert("topics", { sub_chapter_id: subChapterId, slug: topicSlug, name: topicName, description: null, sort_order: 0 }, "sub_chapter_id,slug");
            stats.topics++;

            const payload = notesToHtml(title, notes);
            const teaser = buildTeaser(title, notes);
            const variants = [];
            if (raw.latex) variants.push({ label: "LaTeX", interface: "latex", content: `<h3>${title} — LaTeX</h3>${notes.map((n) => `<p>${n}</p>`).join("")}` });
            if (raw.year || raw.examSource) variants.push({ label: "Exam Info", interface: "exam", content: `<h3>${title} — Exam Info</h3><p>Year: ${raw.year ?? "N/A"}<br/>Source: ${raw.examSource ?? "N/A"}</p>` });
            if (raw.graph) variants.push({ label: "Graph", interface: "graph", content: `<h3>${title} — Graph</h3><pre>${JSON.stringify(raw.graph, null, 2)}</pre>` });

            await upsert("content_items", { topic_id: topicId, title, access_level: 4, owner_contact: "ravikisan1814@gmail.com", public_teaser: teaser, locked_payload: payload, variants }, "topic_id,title");
            stats.contentItems++;
            console.log(`      [Topic] ${topicName}`);
          } catch (err) {
            stats.errors.push(`${rel}: ${err.message}`);
            console.error(`      ERROR ${rel}: ${err.message}`);
          }
        }
      }
    }
  }

  console.log(`\n=== Migration Summary ===`);
  console.log(`Subjects:      ${stats.subjects}`);
  console.log(`Chapters:      ${stats.chapters}`);
  console.log(`Sub-chapters:  ${stats.subChapters}`);
  console.log(`Topics:        ${stats.topics}`);
  console.log(`Content items: ${stats.contentItems}`);
  console.log(`Skipped:       ${stats.skipped}`);
  if (stats.errors.length > 0) {
    console.log(`\nErrors (${stats.errors.length}):`);
    for (const e of stats.errors) console.log(`  - ${e}`);
  }
  console.log(`\nMigration complete!`);
}

main().catch((err) => { console.error("\nFATAL:", err); process.exit(1); });
