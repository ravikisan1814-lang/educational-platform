import { getAdminClient, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/topics?slug=:slug
 * Returns a topic with its resources
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return Response.json({ error: "slug parameter required" }, { status: 400 });
    }

    const sb = getAdminClient();

    const { data: topic, error: e1 } = await sb
      .from("topics")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (e1 || !topic) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const { data: resources, error: e2 } = await sb
      .from("resources")
      .select("*")
      .eq("topic_id", topic.id)
      .eq("is_published", true);

    if (e2) throw e2;

    return Response.json({ topic, resources: resources ?? [] });
  } catch (e) {
    return Response.json(handleError(e), { status: 500 });
  }
}
