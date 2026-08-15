/** Quick post-migration check — prints counts only, no secrets. */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

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
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: group } = await admin.from("exam_groups").select("id, slug, name").eq("slug", "class-11").single();
if (!group) {
  console.error("class-11 exam group not found");
  process.exit(1);
}

const { data: subjects } = await admin
  .from("subjects")
  .select("slug, name, chapters(id, slug, name, sub_chapters(id, slug, topics(id, content_items(id))))")
  .eq("exam_group_id", group.id)
  .order("sort_order");

let topics = 0;
let items = 0;
let chapters = 0;

for (const s of subjects ?? []) {
  for (const c of s.chapters ?? []) {
    chapters++;
    for (const sc of c.sub_chapters ?? []) {
      for (const t of sc.topics ?? []) {
        topics++;
        items += (t.content_items ?? []).length;
      }
    }
  }
}

console.log(`Exam group: ${group.name} (${group.slug})`);
console.log(`Subjects (${subjects?.length ?? 0}): ${(subjects ?? []).map((s) => s.slug).join(", ")}`);
console.log(`Chapters: ${chapters}, Topics: ${topics}, Content items: ${items}`);

for (const s of subjects ?? []) {
  const ch = (s.chapters ?? []).length;
  if (ch === 0) console.log(`  ${s.slug}: (no chapters yet)`);
  else console.log(`  ${s.slug}: ${ch} chapter(s)`);
}
