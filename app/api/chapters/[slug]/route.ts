import { getAdminClient, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/chapters/[slug]
 * Returns a chapter with its topics and progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const sb = getAdminClient();

    const { data: chapter, error: e1 } = await sb
      .from("chapters")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (e1 || !chapter) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const { data: topics, error: e2 } = await sb
      .from("topics")
      .select("*")
      .eq("chapter_id", chapter.id)
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (e2) throw e2;

    const topicIds = (topics ?? []).map((t) => t.id);
    let completed = 0;

    // Check progress if authenticated
    const authHeader = request.headers.get("authorization") ?? "";
    if (authHeader.startsWith("Bearer ") && topicIds.length > 0) {
      const token = authHeader.slice(7);
      const { data: { user } } = await sb.auth.getUser(token);
      if (user) {
        const { count } = await sb
          .from("user_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .in("topic_id", topicIds)
          .eq("completed", true);
        completed = count ?? 0;
      }
    }

    return Response.json({
      chapter,
      topics: topics ?? [],
      progress: { completed, total: topicIds.length },
    });
  } catch (e) {
    return Response.json(handleError(e), { status: 500 });
  }
}
