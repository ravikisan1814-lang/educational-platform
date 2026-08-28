import { getAdminClient, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/levels/[slug]
 * Returns a single level with its classes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const sb = getAdminClient();

    const { data: level, error: e1 } = await sb
      .from("education_levels")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (e1 || !level) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const { data: classes, error: e2 } = await sb
      .from("classes")
      .select("*")
      .eq("education_level_id", level.id)
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (e2) throw e2;

    return Response.json({ level, classes: classes ?? [] });
  } catch (e) {
    return Response.json(handleError(e), { status: 500 });
  }
}
