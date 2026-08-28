import { getAdminClient, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/progress
 */
export async function POST(request: NextRequest) {
  try {
    const sb = getAdminClient();
    const authHeader = request.headers.get("authorization") ?? "";

    if (!authHeader.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { topic_id, completed } = body;

    const { data, error } = await sb
      .from("user_progress")
      .upsert({ user_id: user.id, topic_id, completed })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (e) {
    return Response.json(handleError(e), { status: 500 });
  }
}
