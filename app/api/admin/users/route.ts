import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import type { AccessLevel } from "@/lib/types";
import { validateAccessLevel } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set(["pending", "active", "rejected", "hold"]);

interface ProfileRow {
  id: string;
  email: string;
  status: string;
  access_level: number;
  approved_at: string | null;
}

/**
 * GET /api/admin/users
 *
 * Owner-only. Returns all profiles with id, email, status, access_level,
 * approved_at.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("access_level")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.access_level !== 1) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, email, status, access_level, approved_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (rows ?? []) as ProfileRow[] });
}

/**
 * PATCH /api/admin/users
 *
 * Owner-only. Body: { userId, status?, access_level? }
 */
export async function PATCH(request: Request) {
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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("access_level")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.access_level !== 1) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.body.status !== undefined) {
    updates.status = parsed.body.status;
  }
  if (parsed.body.access_level !== undefined) {
    updates.access_level = parsed.body.access_level;
  }

  const { data: row, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", parsed.body.userId)
    .select("id, email, status, access_level, approved_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: row as ProfileRow });
}

function validateBody(
  raw: unknown
): { ok: true; body: { userId: string; status?: string; access_level?: AccessLevel } } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const record = raw as Record<string, unknown>;

  const userId = record.userId;
  if (typeof userId !== "string" || userId.trim().length === 0) {
    return { ok: false, error: "userId must be a non-empty string" };
  }

  const status = record.status;
  if (status !== undefined) {
    if (typeof status !== "string" || !ALLOWED_STATUSES.has(status)) {
      return { ok: false, error: `status must be one of: ${[...ALLOWED_STATUSES].join(", ")}` };
    }
  }

  let access_level: AccessLevel | undefined;
  if (record.access_level !== undefined) {
    if (!validateAccessLevel(record.access_level)) {
      return { ok: false, error: "access_level must be an integer 1..4" };
    }
    access_level = record.access_level as AccessLevel;
  }

  if (status === undefined && access_level === undefined) {
    return { ok: false, error: "Must provide status or access_level" };
  }

  return {
    ok: true,
    body: { userId: userId.trim(), status, access_level },
  };
}
