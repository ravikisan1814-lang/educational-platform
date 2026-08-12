import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import {
  validateAccessLevel,
} from "@/lib/access";
import type {
  AccessLevel,
  ContentItemDetail,
  ContentVariant,
} from "@/lib/types";

export const dynamic = "force-dynamic";

interface ContentItemRpcRow {
  id: string;
  topic_id: string;
  title: string;
  access_level: number;
  owner_contact: string | null;
  public_teaser: string;
  variant_labels: string[];
  is_locked: boolean;
  locked_payload: string | null;
  variants: ContentVariant[] | null;
}

/**
 * GET /api/content/[id]
 *
 * PUBLIC route serving the topic page. Calls the SECURITY DEFINER RPC
 * `get_content_item(uuid)` which is the database gate:
 *
 *   - Always returns: metadata + public_teaser + variant_labels + is_locked.
 *   - Returns locked_payload + variants ONLY when
 *     content_item.access_level >= current_access_level().
 *     Anonymous / under-tier users get `is_locked: true` and
 *     `locked_payload: null` / `variants: null` — the 90% is never leaked.
 *
 * The route itself does NOT query the table columns directly (they are not
 * granted to anon/authenticated anyway); the tier decision lives INSIDE
 * PostgreSQL.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    // Supabase env vars not configured. Return a deterministic response so
    // the viewer can render and demo-mode E2E tests can run.
    return NextResponse.json({
      data: {
        id,
        topic_id: "demo-topic",
        title: "Demo content item",
        access_level: 4,
        owner_contact: "ravikisan1814@gmail.com",
        public_teaser:
          "<p>Demo teaser — the open 10% concept is always visible.</p>",
        variant_labels: ["Type 1"],
        is_locked: false,
        locked_payload:
          "<p>Demo full notes (public tier in demo mode).</p>",
        variants: null,
      } satisfies ContentItemDetail,
    });
  }

  const { data, error } = await supabase.rpc("get_content_item", {
    p_item_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // RPC returns null for unknown ids (no existence leak).
  if (!data) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  const row = data as unknown as ContentItemRpcRow;

  // Validate/normalize the access_level (fail-safe cast; API consumers get
  // the canonical AccessLevel union).
  const accessLevel: AccessLevel = validateAccessLevel(row.access_level)
    ? row.access_level
    : 4;

  const detail: ContentItemDetail = {
    id: row.id,
    topic_id: row.topic_id,
    title: row.title,
    access_level: accessLevel,
    owner_contact: row.owner_contact,
    public_teaser: row.public_teaser,
    variant_labels: Array.isArray(row.variant_labels)
      ? row.variant_labels
      : ["Type 1"],
    is_locked: Boolean(row.is_locked),
    // Under-tier users get null here — the 90% is NOT leaked to the client.
    locked_payload: row.is_locked ? null : (row.locked_payload ?? null),
    variants: row.is_locked ? null : (row.variants ?? null),
  };

  return NextResponse.json({ data: detail });
}