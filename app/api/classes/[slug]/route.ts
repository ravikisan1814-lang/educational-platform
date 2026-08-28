import { getAdminClient, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/classes/[slug]
 * Returns a class with its subjects
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const sb = getAdminClient();

    const { data: cls, error: e1 } = await sb
      .from("classes")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (e1 || !cls) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const { data: subjects, error: e2 } = await sb
      .from("subjects")
      .select("*")
      .eq("class_id", cls.id)
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (e2) throw e2;

    return Response.json({ class: cls, subjects: subjects ?? [] });
  } catch (e) {
    return Response.json(handleError(e), { status: 500 });
  }
}
