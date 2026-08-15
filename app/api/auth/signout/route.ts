import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/auth/signout
 *
 * Signs the current user out. Returns 200 on success.
 */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
