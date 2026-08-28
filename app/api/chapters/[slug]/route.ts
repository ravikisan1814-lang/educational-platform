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
 * GET /api/chapters/[slug]
 * Returns a chapter with its topics and progress
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sb = getAdminClient();

  // Try old schema
  const { data: chapter, error: e1 } = await sb
    .from("chapters")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!e1 && chapter) {
    const { data: topics, error: e2 } = await sb
      .from("topics")
      .select("*")
      .eq("chapter_id", chapter.id)
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (!e2) {
      const topicIds = (topics ?? []).map((t) => t.id);
      let completed = 0;
      // Try to get progress (requires auth, skip if anonymous)
      try {
        const authHeader = (_request.headers.get("authorization") ?? "") as string;
        if (authHeader.startsWith("Bearer ")) {
          const token = authHeader.slice(7);
          const { data: { user } } = await sb.auth.getUser(token);
          if (user && topicIds.length > 0) {
            const { count } = await sb
              .from("user_progress")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .in("topic_id", topicIds)
              .eq("completed", true);
            completed = count ?? 0;
          }
        }
      } catch {
        // ignore auth errors
      }

      return NextResponse.json({
        chapter,
        topics: topics ?? [],
        progress: { completed, total: topicIds.length },
      });
    }
  }

  // Fallback to new schema
  const { data: ch, error: e3 } = await sb
    .from("chapters")
    .select("*")
    .eq("slug", slug)
    .limit(1);

  if (!e3 && ch && ch.length > 0) {
    const chapter = ch[0];
    const { data: topics, error: e4 } = await sb
      .from("topics")
      .select("*")
      .eq("chapter_id", chapter.id)
      .order("sort_order", { ascending: true });

    if (!e4) {
      return NextResponse.json({
        chapter: { ...chapter, order: chapter.sort_order, is_active: true },
        topics: topics ?? [],
        progress: { completed: 0, total: (topics ?? []).length },
      });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
