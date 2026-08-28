import { getAdminClient, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/levels
 * Returns all education levels
 */
export async function GET(request: NextRequest) {
  try {
    const sb = getAdminClient();
    const { data, error } = await sb
      .from("education_levels")
      .select("*")
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (error) throw error;
    return Response.json(data ?? []);
  } catch (e) {
    return Response.json(handleError(e), { status: 500 });
  }
}
