import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("access_level, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.access_level !== 1 || profile.status !== "approved") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  return { supabase };
}

export async function GET() {
  const ctx = await requireOwner();
  if (ctx instanceof NextResponse) return ctx;

  const [{ count: totalUsers }, { count: pendingUsers }, { count: approvedUsers }, { count: totalContent }] =
    await Promise.all([
      ctx.supabase.from("profiles").select("*", { count: "exact", head: true }),
      ctx.supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ctx.supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "approved"),
      ctx.supabase.from("content_items").select("*", { count: "exact", head: true }),
    ]);

  return NextResponse.json({
    data: {
      users: {
        total: totalUsers ?? 0,
        pending: pendingUsers ?? 0,
        approved: approvedUsers ?? 0,
      },
      content: {
        total: totalContent ?? 0,
      },
    },
  });
}
