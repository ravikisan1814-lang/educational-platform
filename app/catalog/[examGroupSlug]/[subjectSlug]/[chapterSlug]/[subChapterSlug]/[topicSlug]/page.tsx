import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { TopicContentView } from "@/components/TopicContentView";
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
      "id, topic_id, title, access_level, owner_contact, public_teaser, locked_payload, variants, block_type, section_index, note_type, metadata"
    )
    .eq("topic_id", topic.id);

  if (contentError) {
    notFound();
  }

  let userAccessLevel = 4;
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

  const raw = (contentItems ?? [])[0] ?? null;

  const contentItem: ContentItemDetail | null = raw
    ? {
        id: raw.id,
        topic_id: raw.topic_id,
        title: raw.title,
        access_level: raw.access_level ?? 4,
        owner_contact: raw.owner_contact ?? null,
        public_teaser: raw.public_teaser ?? "",
        variant_labels: [],
        is_locked: true,
        block_type: raw.block_type ?? null,
        section_index: raw.section_index ?? null,
        note_type: raw.note_type ?? null,
        metadata: raw.metadata ?? null,
        locked_payload: raw.locked_payload ?? null,
        variants: raw.variants ?? null,
      }
    : null;

  return (
    <div className="page-shell">
      <TopicContentView
        content={contentItem}
        userAccessLevel={userAccessLevel}
      />
    </div>
  );
}
