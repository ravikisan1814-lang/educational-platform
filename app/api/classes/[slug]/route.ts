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
 * GET /api/classes/[slug]
 * Returns a class with its subjects
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sb = getAdminClient();

  // Try old schema
  const { data: cls, error: e1 } = await sb
    .from("classes")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!e1 && cls) {
    const { data: subjects, error: e2 } = await sb
      .from("subjects")
      .select("*")
      .eq("class_id", cls.id)
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (!e2) {
      return NextResponse.json({ class: cls, subjects: subjects ?? [] });
    }
  }

  // Fallback: try exam_groups as classes
  const { data: group, error: e3 } = await sb
    .from("exam_groups")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!e3 && group) {
    const { data: subjects, error: e4 } = await sb
      .from("subjects")
      .select("*")
      .eq("exam_group_id", group.id)
      .order("sort_order", { ascending: true });

    if (!e4) {
      return NextResponse.json({
        class: {
          id: group.id,
          slug: group.slug,
          name: group.name,
          description: group.description,
          order: group.sort_order,
          is_active: true,
        },
        subjects: subjects ?? [],
      });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
