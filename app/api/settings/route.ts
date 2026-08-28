import { getAdminClient, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/settings
 * Returns platform settings as key-value pairs
 */
export async function GET() {
  try {
    const sb = getAdminClient();
    const { data, error } = await sb
      .from("settings")
      .select("*")
      .order("key", { ascending: true });

    if (error) throw error;

    const settings: Record<string, any> = {};
    for (const s of data ?? []) {
      settings[s.key] = s.value;
    }

    return Response.json(settings);
  } catch (e) {
    return Response.json(handleError(e), { status: 500 });
  }
}
