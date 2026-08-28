import { getAdminClient, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/auth/me
 * Returns current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const sb = getAdminClient();

    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await sb
      .from("profiles")
      .select("full_name, role, credits, premium_status")
      .eq("id", user.id)
      .maybeSingle();

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name ?? null,
        role: profile?.role ?? null,
        credits: profile?.credits ?? 0,
        premiumStatus: profile?.premium_status ?? false,
      },
    });
  } catch (e) {
    return Response.json(handleError(e), { status: 500 });
  }
}
