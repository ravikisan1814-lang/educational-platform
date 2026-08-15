import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OWNER_CONTACT = "ravikisan1814@gmail.com";

interface SigninRequestBody {
  email: string;
  password: string;
}

/**
 * POST /api/auth/signin
 *
 * Signs in with email/password. If the profile is pending or rejected,
 * returns 403 with `error: "pending"` so the UI can show the approval
 * notice. Active/owner accounts receive the session.
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.body.email,
    password: parsed.body.password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Invalid credentials" },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, access_level")
    .eq("id", data.user.id)
    .maybeSingle();

  const status = profile?.status ?? "active";
  const accessLevel = profile?.access_level ?? 4;

  if (status === "pending" || status === "rejected") {
    return NextResponse.json(
      {
        error: "pending",
        contact: OWNER_CONTACT,
        status,
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      access_level: accessLevel,
    },
    session: data.session,
  });
}

function validateBody(
  raw: unknown
): { ok: true; body: SigninRequestBody } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const record = raw as Record<string, unknown>;

  const email = record.email;
  if (typeof email !== "string" || email.trim().length === 0) {
    return { ok: false, error: "email must be a non-empty string" };
  }

  const password = record.password;
  if (typeof password !== "string" || password.length === 0) {
    return { ok: false, error: "password must be a non-empty string" };
  }

  return { ok: true, body: { email: email.trim(), password } };
}
