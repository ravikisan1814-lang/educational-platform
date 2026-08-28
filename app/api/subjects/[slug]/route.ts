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
 * GET /api/subjects/[slug]
 * Returns a subject with its chapters (handles duplicate slugs across classes)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sb = getAdminClient();

  // Try old schema
  const { data: subjects, error: e1 } = await sb
    .from("subjects")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .order("order", { ascending: true });

  if (!e1 && subjects && subjects.length > 0) {
    const subject = subjects[0];
    const { data: chapters, error: e2 } = await sb
      .from("chapters")
      .select("*")
      .eq("subject_id", subject.id)
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (!e2) {
      return NextResponse.json({
        subject,
        allSubjects: subjects,
        chapters: chapters ?? [],
      });
    }
  }

  // Fallback to new schema
  const { data: subj, error: e3 } = await sb
    .from("subjects")
    .select("*")
    .eq("slug", slug)
    .order("sort_order", { ascending: true })
    .limit(1);

  if (!e3 && subj && subj.length > 0) {
    const subject = subj[0];
    const { data: chapters, error: e4 } = await sb
      .from("chapters")
      .select("*")
      .eq("subject_id", subject.id)
      .order("sort_order", { ascending: true });

    if (!e4) {
      return NextResponse.json({
        subject: {
          ...subject,
          order: subject.sort_order,
          is_active: true,
        },
        allSubjects: subj,
        chapters: chapters ?? [],
      });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
