import { getAdminClient, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/auth/login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }

    const sb = getAdminClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { data: profile } = await sb
      .from("profiles")
      .select("full_name, role, credits, premium_status")
      .eq("id", data.user.id)
      .maybeSingle();

    return Response.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name ?? null,
        role: profile?.role ?? null,
        credits: profile?.credits ?? 0,
        premiumStatus: profile?.premium_status ?? false,
      },
      session: data.session,
    });
  } catch (e) {
    return Response.json(handleError(e), { status: 500 });
  }
}
