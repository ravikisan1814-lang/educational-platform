import type { ExamGroupNode } from "@/lib/types";

export interface SearchHit {
  id: string;
  label: string;
  /** Breadcrumb path shown in search results, e.g. "Class 11 › Physics › Mechanics" */
  path: string;
  href: string;
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

/** Flatten the hierarchy tree into searchable rows (subjects through topics). */
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
            hits.push({
              id: `topic-${topic.id}`,
              label: topic.name,
              path: `${group.name} › ${subject.name} › ${chapter.name} › ${sub.name} › ${topic.name}`,
              href: item
                ? topicHref(
                    group.slug,
                    subject.slug,
                    chapter.slug,
                    sub.slug,
                    topic.slug,
                    item.id
                  )
                : `/learn/${group.slug}/${subject.slug}/${chapter.slug}/${sub.slug}/${topic.slug}`,
            });
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
    .filter(
      (hit) =>
        hit.label.toLowerCase().includes(q) ||
        hit.path.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
