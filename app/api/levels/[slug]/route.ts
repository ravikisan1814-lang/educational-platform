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
 * GET /api/levels/[slug]
 * Returns a single education level with its classes
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sb = getAdminClient();

  // Try old schema
  const { data: level, error: e1 } = await sb
    .from("education_levels")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!e1 && level) {
    const { data: classes, error: e2 } = await sb
      .from("classes")
      .select("*")
      .eq("education_level_id", level.id)
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (!e2) {
      return NextResponse.json({ level, classes: classes ?? [] });
    }
  }

  // Fallback to new schema (exam_groups)
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
        level: {
          id: group.id,
          slug: group.slug,
          name: group.name,
          description: group.description,
          order: group.sort_order,
          is_active: true,
          created_at: group.created_at,
          updated_at: group.updated_at,
        },
        classes: (subjects ?? []).map((s) => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
          description: s.description,
          order: s.sort_order,
          is_active: true,
        })),
      });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
