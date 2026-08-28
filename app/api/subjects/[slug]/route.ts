import { getAdminClient, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/subjects/[slug]
 * Returns a subject with its chapters (handles duplicate slugs across classes)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const sb = getAdminClient();

    const { data: subjects, error: e1 } = await sb
      .from("subjects")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (e1) throw e1;
    if (!subjects || subjects.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const subject = subjects[0];

    const { data: chapters, error: e2 } = await sb
      .from("chapters")
      .select("*")
      .eq("subject_id", subject.id)
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (e2) throw e2;

    return Response.json({
      subject,
      allSubjects: subjects,
      chapters: chapters ?? [],
    });
  } catch (e) {
    return Response.json(handleError(e), { status: 500 });
  }
}
