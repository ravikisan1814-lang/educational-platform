import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OWNER_CONTACT = "ravikisan1814@gmail.com";

interface SignupRequestBody {
  email: string;
  password: string;
}

/**
 * POST /api/auth/signup
 *
 * Creates a new Supabase Auth user. The database trigger sets
 * profiles.status = 'pending' and access_level = 4 (Public).
 * Returns 200 with pending flag — does NOT auto-login.
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

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.body.email,
    password: parsed.body.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    pending: true,
    contact: OWNER_CONTACT,
    user: data.user ?? null,
  });
}

function validateBody(
  raw: unknown
): { ok: true; body: SignupRequestBody } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const record = raw as Record<string, unknown>;

  const email = record.email;
  if (typeof email !== "string" || email.trim().length === 0) {
    return { ok: false, error: "email must be a non-empty string" };
  }

  const password = record.password;
  if (typeof password !== "string" || password.length < 6) {
    return { ok: false, error: "password must be at least 6 characters" };
  }

  return { ok: true, body: { email: email.trim(), password } };
}
