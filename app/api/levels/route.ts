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
 * GET /api/levels
 * Returns all education levels (maps to exam_groups in new schema, or education_levels in old)
 */
export async function GET() {
  const sb = getAdminClient();

  // Try old schema first
  const { data: levels, error: e1 } = await sb
    .from("education_levels")
    .select("*")
    .eq("is_active", true)
    .order("order", { ascending: true });

  if (!e1 && levels && levels.length > 0) {
    return NextResponse.json(levels);
  }

  // Fallback to new schema (exam_groups)
  const { data: groups, error: e2 } = await sb
    .from("exam_groups")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!e2 && groups) {
    return NextResponse.json(
      groups.map((g) => ({
        id: g.id,
        slug: g.slug,
        name: g.name,
        description: g.description,
        order: g.sort_order,
        is_active: true,
        created_at: g.created_at,
        updated_at: g.updated_at,
      }))
    );
  }

  return NextResponse.json([]);
}
