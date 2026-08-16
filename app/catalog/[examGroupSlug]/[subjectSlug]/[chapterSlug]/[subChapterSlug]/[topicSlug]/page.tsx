import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {TopicContentView} from "@/components/TopicContentView";
import type { ContentItemDetail } from "@/lib/types";

interface Params {
  examGroupSlug: string;
  subjectSlug: string;
  chapterSlug: string;
  subChapterSlug: string;
  topicSlug: string;
}

export default async function CatalogTopicPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const {
    examGroupSlug,
    subjectSlug,
    chapterSlug,
    subChapterSlug,
    topicSlug,
  } = await params;

  const supabase = await createClient();

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select(
      "id, slug, name, description, sort_order, sub_chapter_id, chapters(slug, name), sub_chapters(slug, name)"
    )
    .eq("slug", topicSlug)
    .maybeSingle();

  if (topicError || !topic) {
    notFound();
  }

  const { data: contentItems, error: contentError } = await supabase
    .from("content_items")
    .select(
      "id, topic_id, title, access_level, owner_contact, public_teaser"
    )
    .eq("topic_id", topic.id)
    .order("sort_order", { ascending: true });

  if (contentError || !contentItems || contentItems.length === 0) {
    notFound();
  }

  const firstItem = contentItems[0];

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "get_content_item",
    { p_item_id: firstItem.id }
  );

  if (rpcError || !rpcResult) {
    notFound();
  }

  const detail = rpcResult as unknown as ContentItemDetail;

  return (
    <div className="page-shell">
      <TopicContentView content={detail} userAccessLevel={detail.access_level} />
    </div>
  );
}