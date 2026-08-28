import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

/**
 * GET /api/topics?slug=:slug
 * Returns a topic with its resources
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug parameter required" }, { status: 400 });
  }

  const sb = getAdminClient();

  // Try old schema
  const { data: topic, error: e1 } = await sb
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!e1 && topic) {
    const { data: resources, error: e2 } = await sb
      .from("resources")
      .select("*")
      .eq("topic_id", topic.id)
      .eq("is_published", true);

    if (!e2) {
      return NextResponse.json({ topic, resources: resources ?? [] });
    }
  }

  // Fallback to new schema
  const { data: t, error: e3 } = await sb
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .limit(1);

  if (!e3 && t && t.length > 0) {
    const topic = t[0];
    const { data: items, error: e4 } = await sb
      .from("content_items")
      .select("*")
      .eq("topic_id", topic.id)
      .order("sort_order", { ascending: true });

    if (!e4) {
      return NextResponse.json({
        topic: { ...topic, is_active: true },
        resources: items ?? [],
      });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
