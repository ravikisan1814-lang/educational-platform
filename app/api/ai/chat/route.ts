import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { generateAI, AIProviderConfigError, AIProviderError } from "@/lib/ai";
import type { AIChatRole } from "@/lib/ai";
import type { ExamGroupNode } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 20_000;

interface ChatRequestBody {
  messages: Array<{ role: AIChatRole; content: string }>;
}

/**
 * POST /api/ai/chat
 *
 * Platform-scoped AI chat. Fetches the full syllabus hierarchy (with URLs)
 * and injects it into the system prompt so the AI can answer questions about
 * the website content and return clickable links to chapters/topics/notes.
 *
 * The AI is restricted to platform-only questions — for out-of-scope queries
 * it replies with the "official site" fallback message.
 *
 * Request body:
 *   { messages: [{ role: "user"|"assistant", content: string }] }
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = validateBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.body;

  // Build the hierarchy context (with URLs) for the system prompt.
  const context = await buildHierarchyContext();

  const systemPrompt = `You are the EduPlatform assistant for an educational platform covering NEB (National Examination Board) Class 11 & 12 and CDC (Curriculum Development Centre) curriculum.

You may ONLY answer questions relating to this educational platform: its syllabus, notes, content, study material, access tiers, subjects, and how to use the platform.

When the user asks about a chapter, topic, or note, reply with the exact clickable link(s) from the syllabus map below. Use markdown links like [Topic Name](/learn/group/subject/chapter/sub-chapter/topic). Always include the full path so the user can click straight to the content.

For any out-of-scope query (anything not about this platform), reply exactly with: "I can only help with questions about this educational platform. For anything else, please visit our official site."

Here is the full syllabus map with URLs:

${context}
`.trim();

  try {
    const result = await generateAI({
      messages: [
        { role: "system", content: systemPrompt },
        ...body.messages,
      ],
      temperature: 0.4,
      maxTokens: 1500,
    });
    return NextResponse.json({ data: result });
  } catch (err) {
    if (err instanceof AIProviderConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof AIProviderError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("Unexpected AI chat failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Builds a plain-text syllabus map with /learn/ URLs for every node so the
 * LLM can reference exact clickable paths. Falls back to the demo hierarchy
 * when Supabase is not configured.
 */
async function buildHierarchyContext(): Promise<string> {
  let tree: ExamGroupNode[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exam_groups")
      .select(
        `id, slug, name, description, sort_order,
         subjects(
           id, slug, name, description, sort_order,
           chapters(
             id, slug, name, description, sort_order,
             sub_chapters(
               id, slug, name, description, sort_order,
               topics(
                 id, slug, name, description, sort_order,
                 content_items(id, title, access_level, owner_contact, public_teaser)
               )
             )
           )
         )`
      )
      .order("sort_order");
    if (!error && data) {
      tree = (data as unknown as ExamGroupNode[]) ?? [];
    }
  } catch {
    // Supabase not configured — fall through to demo hierarchy below.
  }

  if (tree.length === 0) {
    tree = DEMO_HIERARCHY;
  }

  const lines: string[] = [];
  for (const group of tree) {
    lines.push(`## ${group.name} (${group.slug})`);
    for (const subject of group.subjects ?? []) {
      lines.push(
        `- Subject: ${subject.name} — /learn/${group.slug}/${subject.slug}`
      );
      for (const chapter of subject.chapters ?? []) {
        lines.push(
          `  - Chapter: ${chapter.name} — /learn/${group.slug}/${subject.slug}/${chapter.slug}`
        );
        for (const sub of chapter.sub_chapters ?? []) {
          lines.push(
            `    - Sub-chapter: ${sub.name} — /learn/${group.slug}/${subject.slug}/${chapter.slug}/${sub.slug}`
          );
          for (const topic of sub.topics ?? []) {
            lines.push(
              `      - Topic: ${topic.name} — /learn/${group.slug}/${subject.slug}/${chapter.slug}/${sub.slug}/${topic.slug}`
            );
            for (const item of topic.content_items ?? []) {
              lines.push(
                `        - Note: ${item.title} — /learn/${group.slug}/${subject.slug}/${chapter.slug}/${sub.slug}/${topic.slug}/${item.id}`
              );
            }
          }
        }
      }
    }
  }
  return lines.join("\n");
}

function validateBody(
  raw: unknown
): { ok: true; body: ChatRequestBody } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const record = raw as Record<string, unknown>;

  const messages = record.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "messages must be a non-empty array" };
  }
  if (messages.length > MAX_MESSAGES) {
    return { ok: false, error: `messages must not exceed ${MAX_MESSAGES} entries` };
  }

  const cleanMessages: ChatRequestBody["messages"] = [];
  for (const entry of messages) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return { ok: false, error: "Each message must be an object" };
    }
    const { role, content } = entry as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") {
      return { ok: false, error: 'Message role must be "user" or "assistant"' };
    }
    if (typeof content !== "string" || content.length === 0) {
      return { ok: false, error: "Message content must be a non-empty string" };
    }
    if (content.length > MAX_MESSAGE_CHARS) {
      return { ok: false, error: `Message content must not exceed ${MAX_MESSAGE_CHARS} chars` };
    }
    cleanMessages.push({ role, content });
  }

  return { ok: true, body: { messages: cleanMessages } };
}

// Demo hierarchy mirror (same as /api/hierarchy) so the chat works without
// a live Supabase project.
const DEMO_HIERARCHY: ExamGroupNode[] = [
  {
    id: "eg-class-11",
    slug: "class-11",
    name: "Class 11",
    description: "NEB Class 11 core curriculum.",
    sort_order: 1,
    subjects: [
      {
        id: "s-11-notes",
        slug: "notes",
        name: "Class 11 notes",
        description: "Core Class 11 notes and study material.",
        sort_order: 1,
        chapters: [
          {
            id: "c-11-physics",
            slug: "physics",
            name: "Physics",
            description: "Mechanics, optics, heat, electricity and modern physics.",
            sort_order: 1,
            sub_chapters: [
              {
                id: "sc-11-vectors",
                slug: "vectors",
                name: "Vectors",
                description: "Vector operations and applications.",
                sort_order: 1,
                topics: [
                  {
                    id: "t-11-vector-addition",
                    slug: "vector-addition",
                    name: "Vector Addition",
                    description: "Adding vectors graphically and by components.",
                    sort_order: 1,
                    content_items: [
                      {
                        id: "ci-11-vector-addition",
                        title: "Vector Addition — Full Notes",
                        topic_id: "t-11-vector-addition",
                        access_level: 2,
                        owner_contact: "ravikisan1814@gmail.com",
                        public_teaser:
                          "<p>Vectors are quantities that have both <strong>magnitude</strong> and <strong>direction</strong>.</p>",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "eg-class-12",
    slug: "class-12",
    name: "Class 12",
    description: "NEB Class 12 core curriculum.",
    sort_order: 2,
    subjects: [
      {
        id: "s-12-notes",
        slug: "notes",
        name: "Class 12 notes",
        description: "Core Class 12 notes and study material.",
        sort_order: 1,
        chapters: [
          {
            id: "c-12-physics",
            slug: "physics",
            name: "Physics",
            description: "Mechanics, optics, heat, electricity and modern physics.",
            sort_order: 1,
            sub_chapters: [
              {
                id: "sc-12-optics",
                slug: "optics",
                name: "Optics",
                description: "Reflection, refraction, mirrors and lenses.",
                sort_order: 1,
                topics: [
                  {
                    id: "t-12-mirror-formula",
                    slug: "mirror-formula",
                    name: "Mirror Formula",
                    description: "1/f = 1/v + 1/u and sign conventions.",
                    sort_order: 1,
                    content_items: [
                      {
                        id: "ci-12-mirror-formula",
                        title: "Mirror Formula — Optics Notes",
                        topic_id: "t-12-mirror-formula",
                        access_level: 2,
                        owner_contact: "ravikisan1814@gmail.com",
                        public_teaser:
                          "<p>The mirror formula relates object distance (u), image distance (v) and focal length (f).</p>",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "eg-loksewa",
    slug: "loksewa",
    name: "Loksewa",
    description: "Loksewa / Public Service Commission exam preparation.",
    sort_order: 3,
    subjects: [
      {
        id: "s-governance",
        slug: "governance-public-admin",
        name: "Governance & Public Admin",
        description: "Constitution, administrative law, and public administration.",
        sort_order: 1,
        chapters: [
          {
            id: "c-constitution",
            slug: "constitutional-law",
            name: "Constitutional Law",
            description: "Nepal constitution, fundamental rights and duties.",
            sort_order: 1,
            sub_chapters: [
              {
                id: "sc-fundamental-rights",
                slug: "fundamental-rights",
                name: "Fundamental Rights",
                description: "Rights and freedoms guaranteed by the constitution.",
                sort_order: 1,
                topics: [
                  {
                    id: "t-right-to-equality",
                    slug: "right-to-equality",
                    name: "Right to Equality",
                    description: "Article 18 of the Constitution of Nepal.",
                    sort_order: 1,
                    content_items: [
                      {
                        id: "ci-right-to-equality",
                        title: "Right to Equality — Constitution Notes",
                        topic_id: "t-right-to-equality",
                        access_level: 3,
                        owner_contact: "ravikisan1814@gmail.com",
                        public_teaser:
                          "<p>The Constitution of Nepal guarantees equality before the law and equal protection of the laws for all citizens.</p>",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];