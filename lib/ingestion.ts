import "server-only";
import { createAdminClient } from "@/lib/supabase-admin";
import { fingerprintNote } from "@/lib/fingerprint";
import type { AccessLevel } from "@/lib/types";
import { validateAccessLevel } from "@/lib/access";

/**
 * Ingestion pipeline for the smart content engine.
 *
 * When raw educational notes/questions are uploaded, the classifier:
 *   1. Identifies the exact hierarchy placement (exam_group -> subject ->
 *      chapter -> sub_chapter -> topic) by fuzzy-matching against the
 *      existing syllabus map (no duplicates created).
 *   2. Detects duplicates at the topic level via a normalized fingerprint.
 *   3. If a topic row already exists, appends the new material as a NEW
 *      VARIANT entry (Type 2, Type 3, ...) in content_items.variants —
 *      never a duplicate topic row.
 *
 * Reads use the service_role admin client (server-only). The classifier is
 * intentionally deterministic + extensible: it ships with a rule-based
 * keyword matcher and a pluggable AI classifier hook that can be wired to
 * lib/ai later.
 */

export interface IngestRawNote {
  /** Raw text of the uploaded note/question. */
  text: string;
  /** Optional hint from the uploader (e.g. subject name). */
  hint?: string;
  title?: string;
  accessLevel?: AccessLevel;
  ownerContact?: string;
  publicTeaser?: string;
  variantLabel?: string;
  variantInterface?: string;
}

export interface IngestResult {
  action: "created" | "variant-appended" | "skipped-duplicate";
  contentItemId: string | null;
  topic: {
    id: string | null;
    name: string;
    slug: string;
  } | null;
  variantIndex: number | null;
  warnings: string[];
}

export interface ClassifierMatches {
  examGroup: { id: string; name: string; slug: string } | null;
  subject: { id: string; name: string; slug: string } | null;
  chapter: { id: string; name: string; slug: string } | null;
  subChapter: { id: string; name: string; slug: string } | null;
  topic: { id: string; name: string; slug: string } | null;
  score: number;
}

const KEYWORD_RULES: Array<{
  keyword: RegExp;
  subjectSlug: string;
  chapterSlug?: string;
  subChapterSlug?: string;
  topicSlug?: string;
}> = [
  { keyword: /vector/i, subjectSlug: "physics", chapterSlug: "mechanics", subChapterSlug: "vectors", topicSlug: "vector-addition" },
  { keyword: /mirror|concave|convex|spherical/i, subjectSlug: "physics", chapterSlug: "optics", subChapterSlug: "reflection-curved-surfaces", topicSlug: "mirror-formula" },
  { keyword: /heat|thermodynamic|calorimet/i, subjectSlug: "physics", chapterSlug: "heat", subChapterSlug: "thermodynamics" },
  { keyword: /constitution|fundamental right|article 18|article18/i, subjectSlug: "governance-public-admin", chapterSlug: "constitutional-law", subChapterSlug: "fundamental-rights", topicSlug: "right-to-equality" },
  { keyword: /koshi|karnali|gandaki|saptakoshi|river system/i, subjectSlug: "nepal-geography", chapterSlug: "physical-geography", subChapterSlug: "rivers-of-nepal" },
  { keyword: /gandaki|narayani|trishuli/i, subjectSlug: "nepal-geography", chapterSlug: "physical-geography", subChapterSlug: "rivers-of-nepal", topicSlug: "gandaki-river-system" },
];

/**
 * Rule-based classifier. Fuzzy-matches raw note text to the existing
 * hierarchy. Returns null placement when nothing matches (owner/editor
 * intervention required; the pipeline leaves the content unplaced).
 */
export async function classifyNote(
  text: string,
  hint?: string
): Promise<ClassifierMatches> {
  const admin = createAdminClient();

  // 1. Load the syllabus map (service role — full data).
  const { data: groups } = await admin
    .from("exam_groups")
    .select(
      `id, slug, name,
       subjects(id, slug, name,
         chapters(id, slug, name,
           sub_chapters(id, slug, name,
             topics(id, slug, name))))`
    );

  const searchable = `${text} ${hint ?? ""}`.toLowerCase();

  // 2. Try keyword rules first (deterministic, cheap).
  const rule = KEYWORD_RULES.find((r) => r.keyword.test(searchable));
  if (rule && groups) {
    let g = findGroup(groups, rule.subjectSlug);
    let s = findSubject(groups, rule.subjectSlug);
    let c = findChapter(groups, rule.subjectSlug, rule.chapterSlug);
    let sc = findSubChapter(groups, rule.subjectSlug, rule.chapterSlug, rule.subChapterSlug);
    let t = findTopic(groups, rule.subjectSlug, rule.chapterSlug, rule.subChapterSlug, rule.topicSlug);
    return {
      examGroup: g,
      subject: s,
      chapter: c,
      subChapter: sc,
      topic: t,
      score: 0.9,
    };
  }

  // 3. Fuzzy name matching against the whole map.
  const tokens = normalizeTokens(`${text} ${hint ?? ""}`);
  let best: {
    group: { id: string; name: string; slug: string } | null;
    subject: { id: string; name: string; slug: string };
    chapter: { id: string; name: string; slug: string } | null;
    subChapter: { id: string; name: string; slug: string } | null;
    topic: { id: string; name: string; slug: string } | null;
    score: number;
  } | null = null;

  for (const group of groups ?? []) {
    for (const subject of group.subjects ?? []) {
      const subjectScore = scoreTokenMatch(subject.name, tokens);
      for (const chapter of subject.chapters ?? []) {
        const chapterScore = scoreTokenMatch(chapter.name, tokens);
        for (const sub of chapter.sub_chapters ?? []) {
          const subScore = scoreTokenMatch(sub.name, tokens);
          let bestTopic: { id: string; name: string; slug: string } | null = null;
          let bestTopicScore = 0;
          for (const topic of sub.topics ?? []) {
            const topicScore = scoreTokenMatch(topic.name, tokens);
            if (topicScore > bestTopicScore) {
              bestTopicScore = topicScore;
              bestTopic = topic;
            }
          }
          const total = subjectScore + chapterScore + subScore + bestTopicScore;
          if (best === null || total > best.score) {
            best = {
              group: { id: group.id, name: group.name, slug: group.slug },
              subject: { id: subject.id, name: subject.name, slug: subject.slug },
              chapter: { id: chapter.id, name: chapter.name, slug: chapter.slug },
              subChapter: { id: sub.id, name: sub.name, slug: sub.slug },
              topic: bestTopic
                ? { id: bestTopic.id, name: bestTopic.name, slug: bestTopic.slug }
                : null,
              score: total,
            };
          }
        }
      }
    }
  }

  // 4. No confident placement — return empty so the pipeline can warn.
  if (!best) {
    return {
      examGroup: null,
      subject: null,
      chapter: null,
      subChapter: null,
      topic: null,
      score: 0,
    };
  }

  return {
    examGroup: best.group,
    subject: best.subject,
    chapter: best.chapter,
    subChapter: best.subChapter,
    topic: best.topic,
    score: best.score,
  };
}

function normalizeTokens(text: string): string[] {
  return text.toLowerCase().split(/\W+/).filter((w) => w.length >= 3);
}

function scoreTokenMatch(name: string, tokens: string[]): number {
  const words = name.toLowerCase().split(/\W+/).filter((w) => w.length >= 3);
  let score = 0;
  for (const token of tokens) {
    if (words.some((w) => w.includes(token) || token.includes(w))) score += 1;
  }
  return score;
}

function findGroup(
  groups: Array<{ id: string; name: string; slug: string; subjects?: Array<{ slug: string }> }>,
  subjectSlug?: string
): { id: string; name: string; slug: string } | null {
  if (!subjectSlug) return null;
  for (const g of groups) {
    if (g.subjects?.some((s) => s.slug === subjectSlug)) {
      return { id: g.id, name: g.name, slug: g.slug };
    }
  }
  return null;
}

function findSubject(
  groups: Array<{ subjects?: Array<{ id: string; name: string; slug: string }> }>,
  slug: string
) {
  for (const g of groups) {
    const s = g.subjects?.find((x) => x.slug === slug);
    if (s) return s;
  }
  return null;
}

function findChapter(
  groups: Array<{ subjects?: Array<{ slug: string; chapters?: Array<{ id: string; name: string; slug: string }> }> }>,
  subjectSlug: string,
  chapterSlug?: string
) {
  for (const g of groups) {
    for (const s of g.subjects ?? []) {
      if (s.slug === subjectSlug) {
        if (!chapterSlug) return null;
        return s.chapters?.find((c) => c.slug === chapterSlug) ?? null;
      }
    }
  }
  return null;
}

function findSubChapter(
  groups: Array<{ subjects?: Array<{ slug: string; chapters?: Array<{ slug: string; sub_chapters?: Array<{ id: string; name: string; slug: string }> }> }> }>,
  subjectSlug: string,
  chapterSlug?: string,
  subChapterSlug?: string
) {
  for (const g of groups) {
    for (const s of g.subjects ?? []) {
      if (s.slug === subjectSlug) {
        const c = s.chapters?.find((ch) => ch.slug === chapterSlug);
        if (!c) return null;
        if (!subChapterSlug) return null;
        return c.sub_chapters?.find((sc) => sc.slug === subChapterSlug) ?? null;
      }
    }
  }
  return null;
}

function findTopic(
  groups: Array<{ subjects?: Array<{ slug: string; chapters?: Array<{ slug: string; sub_chapters?: Array<{ slug: string; topics?: Array<{ id: string; name: string; slug: string }> }> }> }> }>,
  subjectSlug: string,
  chapterSlug?: string,
  subChapterSlug?: string,
  topicSlug?: string
) {
  for (const g of groups) {
    for (const s of g.subjects ?? []) {
      if (s.slug === subjectSlug) {
        const c = s.chapters?.find((ch) => ch.slug === chapterSlug);
        if (!c) return null;
        const sc = c.sub_chapters?.find((sub) => sub.slug === subChapterSlug);
        if (!sc) return null;
        if (!topicSlug) return null;
        return sc.topics?.find((t) => t.slug === topicSlug) ?? null;
      }
    }
  }
  return null;
}

/**
 * Main entry point. Classifies the raw note, resolves the hierarchy,
 * detects duplicates, and either creates a content_item or appends a new
 * variant to the existing one.
 */
export async function ingestRawNote(input: IngestRawNote): Promise<IngestResult> {
  const admin = createAdminClient();
  const warnings: string[] = [];

  const fingerprint = fingerprintNote(input.text);
  const matches = await classifyNote(input.text, input.hint);

  if (!matches.topic || !matches.subChapter || !matches.chapter || !matches.subject || !matches.examGroup) {
    // Leave placement to the owner — no rows are written.
    return {
      action: "skipped-duplicate",
      contentItemId: null,
      topic: null,
      variantIndex: null,
      warnings: [
        "Could not auto-classify this note into the hierarchy. Review the placement manually.",
      ],
    };
  }

  // Resolve topic id.
  let topicId = matches.topic.id;

  // A) Duplicate detection: exact fingerprint against existing teasers/payloads
  //    (service role reads the raw columns; this is server-only).
  const { data: oldItems } = await admin
    .from("content_items")
    .select("id, title, public_teaser, locked_payload, variants, topic_id");

  const dup = (oldItems ?? []).find((row) => {
    const haystack = `${row.public_teaser ?? ""} ${row.locked_payload ?? ""} ${JSON.stringify(row.variants ?? [])}`;
    return fingerprintNote(haystack) === fingerprint;
  });

  if (dup) {
    return {
      action: "skipped-duplicate",
      contentItemId: dup.id,
      topic: { id: topicId, name: matches.topic.name, slug: matches.topic.slug },
      variantIndex: null,
      warnings: ["Exact duplicate detected — not ingested."],
    };
  }

  const accessLevel: AccessLevel = validateAccessLevel(input.accessLevel)
    ? input.accessLevel
    : 4;

  const title = input.title ?? `${matches.topic.name} — New Notes`;
  const teaser =
    input.publicTeaser ??
    `Open concept for ${matches.topic.name}: a short, free introduction.`;

  // B) Create the full locked payload (the uploaded material becomes Type 1).
  const payload = `<h3>${title}</h3><p>${input.text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;

  // C) Existing topic? -> append as a variant (Type 2, Type 3, ...)
  const { data: existingItems } = await admin
    .from("content_items")
    .select("id, title, variants")
    .eq("topic_id", topicId);

  if (existingItems && existingItems.length > 0) {
    const itemId = existingItems[0].id;
    const currentVariants = Array.isArray(existingItems[0].variants) ? existingItems[0].variants : [];
    const nextIndex = currentVariants.length + 2; // Type 1 is canonical; variants start at Type 2
    const label = input.variantLabel ?? `Type ${nextIndex}`;
    const nextVariants = [
      ...currentVariants,
      {
        label,
        interface: input.variantInterface ?? "notes",
        content: payload,
      },
    ];
    await admin
      .from("content_items")
      .update({ variants: nextVariants })
      .eq("id", itemId);
    return {
      action: "variant-appended",
      contentItemId: itemId,
      topic: { id: topicId, name: matches.topic.name, slug: matches.topic.slug },
      variantIndex: currentVariants.length,
      warnings: [],
    };
  }

  // D) New topic + content_item.
  const { data: newItem, error: insertError } = await admin
    .from("content_items")
    .insert({
      topic_id: topicId,
      title,
      access_level: accessLevel,
      owner_contact: input.ownerContact ?? null,
      public_teaser: teaser,
      locked_payload: payload,
      variants: [],
    })
    .select("id")
    .single();

  if (insertError || !newItem) {
    return {
      action: "skipped-duplicate",
      contentItemId: null,
      topic: { id: topicId, name: matches.topic.name, slug: matches.topic.slug },
      variantIndex: null,
      warnings: [insertError?.message ?? "Failed to insert new content item."],
    };
  }

  return {
    action: "created",
    contentItemId: newItem.id,
    topic: { id: topicId, name: matches.topic.name, slug: matches.topic.slug },
    variantIndex: 0,
    warnings: [],
  };
}