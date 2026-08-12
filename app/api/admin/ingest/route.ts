import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { ingestRawNote } from "@/lib/ingestion";
import type { AccessLevel } from "@/lib/types";
import { validateAccessLevel } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_TEXT_CHARS = 100_000;

interface IngestBody {
  text: string;
  hint?: string;
  title?: string;
  accessLevel?: AccessLevel;
  ownerContact?: string;
  publicTeaser?: string;
  variantLabel?: string;
  variantInterface?: string;
}

/**
 * POST /api/admin/ingest
 *
 * Owner-only ingestion endpoint for the smart content engine.
 *   - Authenticates the requester (RLS client).
 *   - Verifies the requester is an Owner (access_level 1).
 *   - Delegates to lib/ingestion.ts::ingestRawNote, which:
 *       * classifies the raw note into the hierarchy,
 *       * detects duplicates via fingerprint,
 *       * creates a content_item OR appends a new variant (Type 2/3/...).
 *
 * The service_role admin client (BYPASSES RLS) is used INSIDE
 * lib/ingestion.ts only for the actual writes — never here to serve content.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Owner-only write gate (mirrors the RLS predicate current_access_level() = 1).
  const { data: profile } = await supabase
    .from("profiles")
    .select("access_level")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.access_level !== 1) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  try {
    const result = await ingestRawNote(parsed.body);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Ingestion failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function validateBody(
  raw: unknown
): { ok: true; body: IngestBody } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const record = raw as Record<string, unknown>;

  const text = record.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    return { ok: false, error: "text must be a non-empty string" };
  }
  if (text.length > MAX_TEXT_CHARS) {
    return { ok: false, error: `text must not exceed ${MAX_TEXT_CHARS} chars` };
  }

  let hint: string | undefined;
  if (record.hint !== undefined) {
    if (typeof record.hint !== "string") {
      return { ok: false, error: "hint must be a string" };
    }
    hint = record.hint;
  }

  let title: string | undefined;
  if (record.title !== undefined) {
    if (typeof record.title !== "string" || record.title.length === 0) {
      return { ok: false, error: "title must be a non-empty string" };
    }
    title = record.title;
  }

  let accessLevel: AccessLevel | undefined;
  if (record.accessLevel !== undefined) {
    if (!validateAccessLevel(record.accessLevel)) {
      return { ok: false, error: "accessLevel must be an integer 1..4" };
    }
    accessLevel = record.accessLevel;
  }

  let ownerContact: string | undefined;
  if (record.ownerContact !== undefined) {
    if (typeof record.ownerContact !== "string") {
      return { ok: false, error: "ownerContact must be a string" };
    }
    ownerContact = record.ownerContact;
  }

  let publicTeaser: string | undefined;
  if (record.publicTeaser !== undefined) {
    if (typeof record.publicTeaser !== "string") {
      return { ok: false, error: "publicTeaser must be a string" };
    }
    publicTeaser = record.publicTeaser;
  }

  let variantLabel: string | undefined;
  if (record.variantLabel !== undefined) {
    if (typeof record.variantLabel !== "string") {
      return { ok: false, error: "variantLabel must be a string" };
    }
    variantLabel = record.variantLabel;
  }

  let variantInterface: string | undefined;
  if (record.variantInterface !== undefined) {
    if (typeof record.variantInterface !== "string") {
      return { ok: false, error: "variantInterface must be a string" };
    }
    variantInterface = record.variantInterface;
  }

  return {
    ok: true,
    body: {
      text,
      hint,
      title,
      accessLevel,
      ownerContact,
      publicTeaser,
      variantLabel,
      variantInterface,
    },
  };
}