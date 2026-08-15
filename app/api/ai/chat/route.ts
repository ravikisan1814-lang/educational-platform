import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { generateAIWithFailover } from "@/lib/ai";
import {
  PLATFORM_SYSTEM_PROMPT,
  buildHierarchyContext,
} from "@/lib/ai/platform-prompt";
import type { ExamGroupNode } from "@/lib/types";
import type { AIChatMessage } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;

interface ChatBody {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * POST /api/ai/chat
 *
 * Platform-scoped assistant. Injects the live syllabus map so replies can
 * link to /learn/... paths. Works without login (public discovery helper).
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
      tree = data as unknown as ExamGroupNode[];
    }
  } catch {
    // Demo / offline — empty context still works with platform rules
  }

  const hierarchyContext = buildHierarchyContext(tree);
  const systemContent = `${PLATFORM_SYSTEM_PROMPT}\n\n${hierarchyContext}`;

  const aiMessages: AIChatMessage[] = [
    { role: "system", content: systemContent },
    ...parsed.body.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  try {
    const result = await generateAIWithFailover({ messages: aiMessages });
    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

function validateBody(
  raw: unknown
): { ok: true; body: ChatBody } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const record = raw as Record<string, unknown>;
  const messages = record.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "messages must be a non-empty array" };
  }
  if (messages.length > MAX_MESSAGES) {
    return { ok: false, error: `messages must not exceed ${MAX_MESSAGES}` };
  }

  const clean: ChatBody["messages"] = [];
  for (const entry of messages) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return { ok: false, error: "Each message must be an object" };
    }
    const { role, content } = entry as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") {
      return { ok: false, error: 'Message role must be "user" or "assistant"' };
    }
    if (typeof content !== "string" || content.trim().length === 0) {
      return { ok: false, error: "Message content must be a non-empty string" };
    }
    if (content.length > MAX_MESSAGE_CHARS) {
      return { ok: false, error: `Message content must not exceed ${MAX_MESSAGE_CHARS} chars` };
    }
    clean.push({ role, content });
  }

  return { ok: true, body: { messages: clean } };
}
