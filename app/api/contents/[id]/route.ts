import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import type { AccessLevel } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/contents/[id]
 *
 * Returns FULL content (file_url, owner_contact) — server-side, RLS-gated.
 * The database itself enforces `access_level >= user.access_level` on the
 * educational_content table, so an unauthorized request simply matches no
 * rows and returns 404. Public (4) users cannot retrieve raw Level 1/2/3
 * content.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("educational_content")
    .select(
      "id, category_id, title, description, file_url, access_level, owner_contact, created_at, updated_at, categories(slug, name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    // Same response for "does not exist" and "insufficient tier" — no leak.
    return NextResponse.json(
      { error: "Not found or insufficient access level" },
      { status: 404 }
    );
  }

  const row = data as unknown as {
    id: string;
    category_id: string;
    title: string;
    description: string | null;
    file_url: string | null;
    access_level: number;
    owner_contact: string | null;
    created_at: string;
    updated_at: string;
    categories: { slug: string; name: string } | null;
  };

  return NextResponse.json({
    data: {
      id: row.id,
      category_id: row.category_id,
      category_slug: row.categories?.slug ?? null,
      category_name: row.categories?.name ?? null,
      title: row.title,
      description: row.description,
      file_url: row.file_url,
      required_access_level: row.access_level as AccessLevel,
      owner_contact: row.owner_contact,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  });
}
