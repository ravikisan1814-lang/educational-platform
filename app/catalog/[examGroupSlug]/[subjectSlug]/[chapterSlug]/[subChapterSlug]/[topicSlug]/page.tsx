import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {TopicContentView} from "@/components/TopicContentView";
import type { ContentItem } from "@/lib/types";

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

  // Fetch the topic by slug, including its hierarchy context
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

  // Fetch content items for this topic
  const { data: contentItems, error: contentError } = await supabase
    .from("content_items")
    .select(
      "id, topic_id, title, access_level, owner_contact, public_teaser, locked_payload, variants"
    )
    .eq("topic_id", topic.id);

  if (contentError) {
    notFound();
  }

  // Determine user access level
  let userAccessLevel = 4; // Anonymous = Public tier
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("access_level")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.access_level) {
      userAccessLevel = profile.access_level;
    }
  }

  // Get the first content item (or could render multiple)
  const contentItem = (contentItems as ContentItem[])[0] || null;

  return (
    <div className="page-shell">
      <TopicContentView
        content={contentItem}
        userAccessLevel={userAccessLevel}
      />
    </div>
  );
}