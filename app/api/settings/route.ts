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
 * GET /api/settings
 * Returns platform settings
 */
export async function GET() {
  const sb = getAdminClient();

  const { data, error } = await sb
    .from("settings")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return as key-value map
  const settings: Record<string, any> = {};
  for (const s of data ?? []) {
    settings[s.key] = s.value;
  }

  return NextResponse.json(settings);
}

/**
 * PATCH /api/settings
 * Update settings (owner only)
 */
export async function PATCH(request: Request) {
  const sb = getAdminClient();
  const body = await request.json();

  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is owner
  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "OWNER" && profile?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await sb
    .from("settings")
    .upsert({ key: body.key, value: body.value })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
