import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { generateAI, AI_PROVIDER_NAMES, AIProviderConfigError, AIProviderError } from "@/lib/ai";
import type { AIChatRole, AIProviderName } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_MESSAGES = 200;
const MAX_MESSAGE_CHARS = 50_000;
const MAX_MODEL_CHARS = 100;

interface GenerateRequestBody {
  provider?: AIProviderName;
  model?: string;
  messages: Array<{ role: AIChatRole; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

/**
 * POST /api/ai/generate
 *
 * Authenticated LLM proxy. Wraps Gemini/Groq behind a single abstraction
 * (lib/ai). Request body:
 *   {
 *     provider?: "gemini" | "groq",      // defaults to AI_DEFAULT_PROVIDER
 *     model?: string,                    // optional model override
 *     messages: [{ role: "system"|"user"|"assistant", content: string }],
 *     temperature?: number,              // 0..2
 *     maxTokens?: number                 // 1..100000
 *   }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

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

  try {
    const result = await generateAI(body);
    return NextResponse.json({ data: result });
  } catch (err) {
    if (err instanceof AIProviderConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof AIProviderError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("Unexpected AI generation failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function validateBody(
  raw: unknown
): { ok: true; body: GenerateRequestBody } | { ok: false; error: string } {
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

  const cleanMessages: GenerateRequestBody["messages"] = [];
  for (const entry of messages) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return { ok: false, error: "Each message must be an object" };
    }
    const { role, content } = entry as { role?: unknown; content?: unknown };
    if (role !== "system" && role !== "user" && role !== "assistant") {
      return { ok: false, error: 'Message role must be "system", "user" or "assistant"' };
    }
    if (typeof content !== "string" || content.length === 0) {
      return { ok: false, error: "Message content must be a non-empty string" };
    }
    if (content.length > MAX_MESSAGE_CHARS) {
      return { ok: false, error: `Message content must not exceed ${MAX_MESSAGE_CHARS} chars` };
    }
    cleanMessages.push({ role, content });
  }

  let provider: AIProviderName | undefined;
  if (record.provider !== undefined) {
    if (typeof record.provider !== "string" || !AI_PROVIDER_NAMES.includes(record.provider as AIProviderName)) {
      return {
        ok: false,
        error: `provider must be one of: ${AI_PROVIDER_NAMES.join(", ")}`,
      };
    }
    provider = record.provider as AIProviderName;
  }

  let model: string | undefined;
  if (record.model !== undefined) {
    if (
      typeof record.model !== "string" ||
      record.model.length === 0 ||
      record.model.length > MAX_MODEL_CHARS ||
      !/^[a-zA-Z0-9._:/-]+$/.test(record.model)
    ) {
      return { ok: false, error: "model must be a valid model identifier" };
    }
    model = record.model;
  }

  let temperature: number | undefined;
  if (record.temperature !== undefined) {
    if (typeof record.temperature !== "number" || !Number.isFinite(record.temperature)) {
      return { ok: false, error: "temperature must be a number" };
    }
    temperature = Math.min(2, Math.max(0, record.temperature));
  }

  let maxTokens: number | undefined;
  if (record.maxTokens !== undefined) {
    if (typeof record.maxTokens !== "number" || !Number.isInteger(record.maxTokens)) {
      return { ok: false, error: "maxTokens must be an integer" };
    }
    maxTokens = Math.min(100_000, Math.max(1, record.maxTokens));
  }

  return {
    ok: true,
    body: { provider, model, messages: cleanMessages, temperature, maxTokens },
  };
}
