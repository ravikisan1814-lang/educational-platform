/**
 * Migration script: imports JSON content from the ravikishan project
 * (../ravikishan/migrated-content) into this platform's Supabase database.
 *
 * Folder structure -> hierarchy mapping:
 *   class-11|class-11e|class-12  -> exam_groups (class-11e can map to class-11)
 *   chemistry|physics|...         -> subjects
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
 *   MIGRATE_TARGET_EXAM_GROUP  (optional, default class-11 — Class 11 Notes track)
 *   MIGRATE_SOURCE_CLASSES     (optional, comma-separated, default class-11,class-11e)
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
const SOURCE_CLASSES = (env.MIGRATE_SOURCE_CLASSES ?? "class-11,class-11e")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** NEB core subjects — seeded under the target exam group even when no JSON exists yet. */
const CORE_SUBJECTS = [
  { slug: "biology", name: "Biology", description: "Life sciences, cell biology, genetics, and ecology." },
  { slug: "chemistry", name: "Chemistry", description: "Physical, organic, and inorganic chemistry." },
  { slug: "english", name: "English", description: "Grammar, literature, and composition." },
  { slug: "mathematics", name: "Mathematics", description: "Algebra, calculus, geometry, and statistics." },
  { slug: "nepali", name: "Nepali", description: "Nepali language, literature, and grammar." },
  { slug: "physics", name: "Physics", description: "Mechanics, waves, electricity, and modern physics." },
];

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

const TYPE_LABELS = { concepts: "Concepts", sets: "Practice Sets", examples: "Worked Examples", formula: "Formulas", mindmap: "Mind Map", notes: "Quick Notes", pyqs: "Past Year Questions", graph: "Graphs" };

// 3. Hierarchy upsert helpers
async function upsert(table, row, conflict) {
  const { data, error } = await admin.from(table).upsert(row, { onConflict: conflict }).select("id").single();
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  return data.id;
}

async function ensureCoreSubjects(examGroupId, classLabel) {
  let seeded = 0;
  for (let i = 0; i < CORE_SUBJECTS.length; i++) {
    const subject = CORE_SUBJECTS[i];
    await upsert(
      "subjects",
      {
        exam_group_id: examGroupId,
        slug: subject.slug,
        name: subject.name,
        description: `${subject.description} (${classLabel}).`,
        sort_order: i + 1,
      },
      "exam_group_id,slug"
    );
    seeded++;
  }
  return seeded;
}

async function main() {
  console.log(`\n=== Content Migration ===`);
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Target exam group: ${TARGET_EXAM_GROUP}`);
  console.log(`Source classes: ${SOURCE_CLASSES.join(", ")}`);
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  const jsonFiles = collectJsonFiles(SOURCE_DIR);
  console.log(`Found ${jsonFiles.length} JSON files total.\n`);

  const stats = { examGroups: 0, subjects: 0, chapters: 0, subChapters: 0, topics: 0, contentItems: 0, skipped: 0, errors: [] };

  // Group files: class -> subject -> unit -> type -> files
  const groups = new Map();
  for (const file of jsonFiles) {
    const rel = relative(SOURCE_DIR, file);
    const parts = rel.split(/[\\/]/);
    if (parts.length < 5) { console.warn(`  SKIP (unexpected depth): ${rel}`); stats.skipped++; continue; }
    const [classSlug, subjectSlug, unitSlug, typeSlug, fileName] = parts;
    if (!SOURCE_CLASSES.includes(classSlug)) continue;
    const targetClass = TARGET_EXAM_GROUP;
    if (!groups.has(targetClass)) groups.set(targetClass, { name: targetClass, subjects: new Map() });
    const cls = groups.get(targetClass);
    if (!cls.subjects.has(subjectSlug)) cls.subjects.set(subjectSlug, { name: subjectSlug, units: new Map() });
    const subj = cls.subjects.get(subjectSlug);
    if (!subj.units.has(unitSlug)) subj.units.set(unitSlug, { name: unitSlug, types: new Map() });
    const unit = subj.units.get(unitSlug);
    if (!unit.types.has(typeSlug)) unit.types.set(typeSlug, []);
    unit.types.get(typeSlug).push({ file, fileName, rel, sourceClass: classSlug });
  }

  if (groups.size === 0) {
    groups.set(TARGET_EXAM_GROUP, { name: TARGET_EXAM_GROUP, subjects: new Map() });
  }

  for (const [classSlug, cls] of groups) {
    const classLabel = classSlug === "class-11" ? "Class 11 Notes" : classSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const examGroupId = await upsert(
      "exam_groups",
      {
        slug: classSlug,
        name: classLabel,
        description: `${classLabel} curriculum content.`,
        sort_order: classSlug === "class-11" ? 1 : classSlug === "class-11e" ? 2 : 3,
      },
      "slug"
    );
    stats.examGroups++;
    console.log(`\n[Exam Group] ${classLabel}`);

    const coreCount = await ensureCoreSubjects(examGroupId, classLabel);
    stats.subjects += coreCount;
    console.log(`  [Subjects] Seeded ${coreCount} core subjects (biology, chemistry, english, mathematics, nepali, physics)`);

    let subjectOrder = CORE_SUBJECTS.length;
    for (const [subjectSlug, subj] of cls.subjects) {
      const core = CORE_SUBJECTS.find((s) => s.slug === subjectSlug);
      const subjectLabel = core?.name ?? subjectSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      subjectOrder++;
      const subjectId = await upsert(
        "subjects",
        {
          exam_group_id: examGroupId,
          slug: subjectSlug,
          name: subjectLabel,
          description: core?.description ?? `${subjectLabel} for ${classLabel}.`,
          sort_order: core ? CORE_SUBJECTS.indexOf(core) + 1 : subjectOrder,
        },
        "exam_group_id,slug"
      );
      if (!core) {
        stats.subjects++;
        console.log(`  [Subject] ${subjectLabel} (extra)`);
      } else {
        console.log(`  [Subject] ${subjectLabel}`);
      }

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

              const topicId = await upsert("topics", { sub_chapter_id: subChapterId, slug: topicSlug, name: topicName, description: null, sort_order: topicOrder }, "sub_chapter_id,slug");
              stats.topics++;

              const payload = notesToHtml(title, notes);
              const teaser = buildTeaser(title, notes);
              const variants = [];
              if (raw.latex) variants.push({ label: "LaTeX", interface: "latex", content: `<h3>${title} — LaTeX</h3>${notes.map((n) => `<p>${n}</p>`).join("")}` });
              if (raw.year || raw.examSource) variants.push({ label: "Exam Info", interface: "exam", content: `<h3>${title} — Exam Info</h3><p>Year: ${raw.year ?? "N/A"}<br/>Source: ${raw.examSource ?? "N/A"}</p>` });
              if (raw.graph) variants.push({ label: "Graph", interface: "graph", content: `<h3>${title} — Graph</h3><pre>${JSON.stringify(raw.graph, null, 2)}</pre>` });

              await upsert("content_items", { topic_id: topicId, title, access_level: 4, owner_contact: "ravikisan1814@gmail.com", public_teaser: teaser, locked_payload: payload, variants }, "topic_id,title");
              stats.contentItems++;
              console.log(`        [Topic] ${topicName}`);
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
  if (stats.errors.length > 0) {
    console.log(`\nErrors (${stats.errors.length}):`);
    for (const e of stats.errors) console.log(`  - ${e}`);
  }
  console.log(`\nMigration complete!`);
}

main().catch((err) => { console.error("\nFATAL:", err); process.exit(1); });