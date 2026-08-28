import { getAdminClient, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/resources
 * Returns all published resources (with optional ?id=:id for single)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const sb = getAdminClient();

    if (id) {
      const { data, error } = await sb
        .from("resources")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (error || !data) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
      return Response.json(data);
    }

    const { data, error } = await sb
      .from("resources")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json(data ?? []);
  } catch (e) {
    return Response.json(handleError(e), { status: 500 });
  }
}
