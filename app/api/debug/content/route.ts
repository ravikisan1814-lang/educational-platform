import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("content_items")
      .select("id, title, public_teaser, locked_payload, access_level")
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      count: data?.length ?? 0,
      items: (data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        access_level: item.access_level,
        teaser_preview: item.public_teaser?.slice(0, 200) ?? "",
        payload_preview: item.locked_payload?.slice(0, 200) ?? "",
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
