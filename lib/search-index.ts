import type { ExamGroupNode, ContentItemSummary } from "@/lib/types";

export interface SearchHit {
  id: string;
  label: string;
  /** Breadcrumb path shown in search results, e.g. "Class 11 › Physics › Mechanics" */
  path: string;
  href: string;
  /** Short excerpt from the note content for visitor-friendly previews */
  excerpt?: string;
}

function topicHref(
  groupSlug: string,
  subjectSlug: string,
  chapterSlug: string,
  subSlug: string,
  topicSlug: string,
  itemId: string
): string {
  return `/learn/${groupSlug}/${subjectSlug}/${chapterSlug}/${subSlug}/${topicSlug}/${itemId}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max = 140): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

function excerptFromNotes(notes: string[] | undefined, fallbackTitle: string): string {
  if (!notes || notes.length === 0) return fallbackTitle;
  const first = notes.find((n) => n.trim().length > 0);
  if (!first) return fallbackTitle;
  const text = stripHtml(first).replace(/\*\*/g, "").replace(/`/g, "");
  return truncate(text, 140);
}

/** Flatten the hierarchy tree into searchable rows (subjects through topics + notes). */
export function buildSearchIndex(tree: ExamGroupNode[]): SearchHit[] {
  const hits: SearchHit[] = [];

  for (const group of tree) {
    for (const subject of group.subjects ?? []) {
      hits.push({
        id: `subject-${subject.id}`,
        label: subject.name,
        path: `${group.name} › ${subject.name}`,
        href: `/learn/${group.slug}/${subject.slug}`,
      });

      for (const chapter of subject.chapters ?? []) {
        hits.push({
          id: `chapter-${chapter.id}`,
          label: chapter.name,
          path: `${group.name} › ${subject.name} › ${chapter.name}`,
          href: `/learn/${group.slug}/${subject.slug}/${chapter.slug}`,
        });

        for (const sub of chapter.sub_chapters ?? []) {
          for (const topic of sub.topics ?? []) {
            const item = topic.content_items?.[0];
            if (item) {
              const itemHref = topicHref(
                group.slug,
                subject.slug,
                chapter.slug,
                sub.slug,
                topic.slug,
                item.id
              );
              hits.push({
                id: `content-${item.id}`,
                label: item.title,
                path: `${group.name} › ${subject.name} › ${chapter.name} › ${sub.name} › ${topic.name}`,
                href: itemHref,
                excerpt: excerptFromNotes(undefined, item.title),
              });
            } else {
              hits.push({
                id: `topic-${topic.id}`,
                label: topic.name,
                path: `${group.name} › ${subject.name} › ${chapter.name} › ${sub.name} › ${topic.name}`,
                href: `/learn/${group.slug}/${subject.slug}/${chapter.slug}/${sub.slug}/${topic.slug}`,
              });
            }
          }
        }
      }
    }
  }

  return hits;
}

export function filterSearchHits(hits: SearchHit[], query: string, limit = 8): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return hits
    .filter((hit) => {
      const haystack = `${hit.label} ${hit.path} ${hit.excerpt ?? ""}`.toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, limit);
}
