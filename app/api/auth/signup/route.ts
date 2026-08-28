import { getAdminClient, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/auth/signup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const sb = getAdminClient();
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) throw error;

    return Response.json({
      ok: true,
      user: data.user ?? null,
      message: "Please check your email to confirm your account",
    });
  } catch (e) {
    return Response.json(handleError(e), { status: 500 });
  }
}
