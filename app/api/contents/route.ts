import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { isContentLockedFor } from "@/lib/access";
import { ACCESS_LEVEL_LABELS, maskedTitle } from "@/lib/types";
import type { AccessLevel, ContentListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Demo fallback used when Supabase env vars are not configured yet
 * (e.g. a fresh Vercel deployment before env setup). Lets the catalog
 * render immediately and keeps the API from returning a 500.
 */
const DEMO_ITEMS: ContentListItem[] = [
  {
    id: "demo-locked-1",
    category_id: "c1",
    category_slug: "class-11",
    category_name: "Class 11",
    is_locked: true,
    required_access_level: 2,
    title: null,
    description: null,
    masked_title: "Locked content (Member tier)",
    owner_contact: null,
  },
  {
    id: "demo-locked-2",
    category_id: "c2",
    category_slug: "class-12",
    category_name: "Class 12",
    is_locked: true,
    required_access_level: 3,
    title: null,
    description: null,
    masked_title: "Locked content (Co-member tier)",
    owner_contact: null,
  },
  {
    id: "demo-open-1",
    category_id: "c3",
    category_slug: "general-knowledge",
    category_name: "General Knowledge",
    is_locked: false,
    required_access_level: 4,
    title: "Free GK samples",
    description: "Open sample questions for everyone.",
    masked_title: null,
    owner_contact: null,
  },
  {
    id: "demo-open-2",
    category_id: "c4",
    category_slug: "loksewa-knowledge",
    category_name: "Loksewa Knowledge",
    is_locked: false,
    required_access_level: 4,
    title: "Loksewa basics",
    description: "Introductory material, publicly available.",
    masked_title: null,
    owner_contact: null,
  },
];

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
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    // Supabase env vars not configured — serve demo data so the catalog
    // still renders. Real data flows in once env vars are set.
      return NextResponse.json({
        data: DEMO_ITEMS,
        user_access_level: 4,
        demo: true,
      });
  }

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
  });
}
