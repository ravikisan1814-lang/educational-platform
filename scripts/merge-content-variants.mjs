/**
 * Find repeated notes (same normalized title under the same chapter) and
 * fold duplicates into Type 2 / Type 3… variants on the original content_item.
 *
 * Usage: node scripts/merge-content-variants.mjs
 */
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

function normalizeTitle(title) {
  return String(title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const env = loadEnv();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Pull hierarchy so we can group by chapter.
  const { data: topics, error } = await admin.from("topics").select(
    `id, name, slug, sub_chapter_id,
     sub_chapters!inner(id, chapter_id, name, slug),
     content_items(id, title, locked_payload, variants, public_teaser, access_level, owner_contact, created_at)`
  );
  if (error) throw error;

  /** @type {Map<string, Array<{topicId:string, chapterId:string, item:any, typeLabel:string}>>} */
  const buckets = new Map();

  for (const topic of topics ?? []) {
    const chapterId = topic.sub_chapters?.chapter_id;
    const typeLabel = topic.sub_chapters?.name ?? "Notes";
    for (const item of topic.content_items ?? []) {
      const key = `${chapterId}::${normalizeTitle(item.title || topic.name)}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push({
        topicId: topic.id,
        chapterId,
        item,
        typeLabel,
      });
    }
  }

  let groupsMerged = 0;
  let rowsDeleted = 0;

  for (const [, rows] of buckets) {
    if (rows.length < 2) continue;

    // Keep oldest as Type 1; rest become Type 2+
    rows.sort((a, b) => String(a.item.created_at).localeCompare(String(b.item.created_at)));
    const [canonical, ...dupes] = rows;
    const existing = Array.isArray(canonical.item.variants) ? canonical.item.variants : [];
    const nextVariants = [...existing];

    for (const dupe of dupes) {
      const n = nextVariants.length + 2;
      const label = `Type ${n}`;
      const content =
        typeof dupe.item.locked_payload === "string"
          ? dupe.item.locked_payload
          : `<h3>${dupe.item.title}</h3><p>(${dupe.typeLabel})</p>`;
      nextVariants.push({
        type: `type-${n}`,
        label,
        interface: "notes",
        content,
        source_type: dupe.typeLabel,
      });
    }

    const { error: updateError } = await admin
      .from("content_items")
      .update({ variants: nextVariants })
      .eq("id", canonical.item.id);
    if (updateError) throw updateError;

    const ids = dupes.map((d) => d.item.id);
    const { error: deleteError } = await admin.from("content_items").delete().in("id", ids);
    if (deleteError) throw deleteError;

    // Remove emptied topics that lost their only content item
    for (const dupe of dupes) {
      const { count } = await admin
        .from("content_items")
        .select("id", { count: "exact", head: true })
        .eq("topic_id", dupe.topicId);
      if (count === 0 && dupe.topicId !== canonical.topicId) {
        await admin.from("topics").delete().eq("id", dupe.topicId);
      }
    }

    groupsMerged += 1;
    rowsDeleted += ids.length;
    console.log(
      `Merged "${canonical.item.title}" → Type 1 + ${dupes.length} variant(s); removed ${ids.length} duplicate row(s).`
    );
  }

  console.log(`Done. Groups merged: ${groupsMerged}. Duplicate rows removed: ${rowsDeleted}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
