import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { isContentLockedFor } from "@/lib/access";
import { ACCESS_LEVEL_LABELS, maskedTitle } from "@/lib/types";
import type { AccessLevel, ContentListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ContentRow {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  /** DB column on educational_content (mapped to required_access_level in the response). */
  access_level: number;
  owner_contact: string | null;
  categories: { slug: string; name: string } | null;
}

/**
 * GET /api/contents
 *
 * Public route. Lists all contents with lock metadata.
 *   - Unlocked items (user tier >= required tier): full metadata.
 *   - Locked items: masked title/description, lock level exposed so the
 *     frontend can render lock badges — raw content is never returned here
 *     (file_url is not even selected; the DB column grants would reject it).
 *   - owner_contact is always exposed so users can reach the content owner.
 *
 * Query params: ?category=<category slug> to filter.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Anonymous users are treated as Public tier (4).
  let accessLevel: AccessLevel = 4;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("access_level")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.access_level) {
      accessLevel = profile.access_level as AccessLevel;
    }
  }

  let query = supabase
    .from("educational_content")
    .select(
      "id, category_id, title, description, access_level, owner_contact, categories(slug, name)"
    );

  const categorySlug = request.nextUrl.searchParams.get("category");
  if (categorySlug) {
    query = query.eq("categories.slug", categorySlug);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items: ContentListItem[] = (
    (data as unknown as ContentRow[] | null) ?? []
  ).map((row) => {
    const required = row.access_level as AccessLevel;
    const isLocked = isContentLockedFor(accessLevel, required);
    return {
      id: row.id,
      category_id: row.category_id,
      category_slug: row.categories?.slug ?? null,
      category_name: row.categories?.name ?? null,
      is_locked: isLocked,
      required_access_level: required,
      title: isLocked ? null : row.title,
      description: isLocked ? null : row.description,
      masked_title: isLocked ? maskedTitle(required) : null,
      owner_contact: row.owner_contact,
    };
  });

  return NextResponse.json({
    data: items,
    user_access_level: accessLevel,
    access_level_label: ACCESS_LEVEL_LABELS[accessLevel],
  });
}
