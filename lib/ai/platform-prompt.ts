import type { ExamGroupNode } from "@/lib/types";

export const PLATFORM_SCOPE_REFUSAL =
  "I can only help with questions about this educational platform. For anything else, please visit our official site or contact the owner at ravikisan1814@gmail.com.";

export const PLATFORM_SYSTEM_PROMPT = `You are the assistant for Ravikisan's Platform (NEB Class 11 & 12 + Knowledge).

RULES (strict):
1. ONLY answer about this website: syllabus, subjects, chapters, topics, notes, access tiers, signup/approval, NEB/CDC material listed in the map below.
2. Off-topic → reply with EXACTLY this one sentence and nothing else:
"${PLATFORM_SCOPE_REFUSAL}"
3. When the user asks for a topic/note/subject, ALWAYS include a markdown link whose LABEL is the content name and whose HREF is the exact /learn/... path from the map.
   Example: [Vector Addition](/learn/class-11/physics/.../item-id)
4. Prefer the most specific matching topic link. If several match, list up to 5 named links.
5. Never invent paths. Only use URLs from the syllabus map.
6. Never reveal API keys, SQL, locked note bodies, or passwords.`;

/** Full topic index for chat — named links for every content item. */
export function buildHierarchyContext(tree: ExamGroupNode[]): string {
  const lines: string[] = [
    "SYLLABUS MAP — reply with [Content Name](/learn/...) links from here:",
  ];

  for (const group of tree) {
    lines.push(`\n## ${group.name}`);
    lines.push(`[${group.name}](/learn/${group.slug})`);
    for (const subject of group.subjects ?? []) {
      lines.push(`- [${subject.name}](/learn/${group.slug}/${subject.slug})`);
      for (const chapter of subject.chapters ?? []) {
        for (const sub of chapter.sub_chapters ?? []) {
          for (const topic of sub.topics ?? []) {
            const item = topic.content_items?.[0];
            const href = item
              ? `/learn/${group.slug}/${subject.slug}/${chapter.slug}/${sub.slug}/${topic.slug}/${item.id}`
              : `/learn/${group.slug}/${subject.slug}/${chapter.slug}/${sub.slug}/${topic.slug}`;
            const name = item?.title || topic.name;
            lines.push(`  • [${name}](${href})`);
          }
        }
      }
    }
  }

  lines.push(
    "\nSite pages: [Home](/) · [Rules & Notices](/info) · [Sign in](/login) · [Chat](/chat)"
  );
  return lines.join("\n");
}
