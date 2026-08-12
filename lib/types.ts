/**
 * Shared domain types for the platform.
 *
 * Access tiers — lower numbers grant MORE access:
 *   1 = Owner, 2 = Member, 3 = Co-member, 4 = Public
 */

export const ACCESS_LEVELS = {
  OWNER: 1,
  MEMBER: 2,
  CO_MEMBER: 3,
  PUBLIC: 4,
} as const;

export type AccessLevel = 1 | 2 | 3 | 4;

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  1: "Owner",
  2: "Member",
  3: "Co-member",
  4: "Public",
};

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface ContentMetadata {
  id: string;
  category_id: string;
  category_slug: string | null;
  category_name: string | null;
  title: string;
  description: string | null;
  required_access_level: AccessLevel;
  /** Contact for the content owner (email/phone), used by the lock-card action. */
  owner_contact: string | null;
}

/** Entry returned by GET /api/contents. Locked items have masked fields. */
export interface ContentListItem {
  id: string;
  category_id: string;
  category_slug: string | null;
  category_name: string | null;
  is_locked: boolean;
  required_access_level: AccessLevel;
  title: string | null;
  description: string | null;
  masked_title: string | null;
  owner_contact: string | null;
  /**
   * Raw file URL. The API never returns this for locked items (RLS + select
   * grants prevent it), but if a copy ever leaks into a client prop the card
   * component masks it before rendering — defense in depth.
   */
  file_url?: string | null;
}

/** Entry returned by GET /api/contents/[id] — only for authorized users. */
export interface ContentDetail extends ContentMetadata {
  body_markdown: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Multi-tier hierarchy model (deep learning):
 *
 *   exam_groups -> subjects -> chapters -> sub_chapters -> topics
 *                          -> content_items
 *
 * Card/cover metadata is PUBLIC so visitors can freely explore the syllabus
 * map; the 90% payload (locked_payload) and variants are tier-gated in the
 * database (see supabase/migrations/0004_hierarchy_content_items.sql).
 */

export interface HierarchyNode {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface ContentItemSummary {
  id: string;
  topic_id: string;
  title: string;
  access_level: AccessLevel;
  owner_contact: string | null;
  public_teaser: string;
}

export interface ContentVariant {
  label: string;
  interface?: string;
  content: string;
}

/** Result of the SECURITY DEFINER get_content_item() gate (RPC). */
export interface ContentItemDetail {
  id: string;
  topic_id: string;
  title: string;
  access_level: AccessLevel;
  owner_contact: string | null;
  public_teaser: string;
  variant_labels: string[];
  is_locked: boolean;
  /** Only present when the requester's tier passes; otherwise null (never leaked). */
  locked_payload: string | null;
  /** Only present when the requester's tier passes; otherwise null (never leaked). */
  variants: ContentVariant[] | null;
}

/** Content item with full locked payload and variants for client-side rendering. */
export interface ContentItem {
  id: string;
  topic_id: string;
  title: string;
  access_level: number;
  owner_contact: string;
  public_teaser: string;
  locked_payload: LockedPayload;
  variants: NoteVariant[];
}

export interface TopicNode extends HierarchyNode {
  content_items: ContentItemSummary[];
}
export interface SubChapterNode extends HierarchyNode {
  topics: TopicNode[];
}
export interface ChapterNode extends HierarchyNode {
  sub_chapters: SubChapterNode[];
}
export interface SubjectNode extends HierarchyNode {
  chapters: ChapterNode[];
}
export interface ExamGroupNode extends HierarchyNode {
  subjects: SubjectNode[];
}

export interface BreadcrumbEntry {
  label: string;
  href: string;
}

export function maskedTitle(requiredLevel: AccessLevel): string {
  return `Locked content (${ACCESS_LEVEL_LABELS[requiredLevel]} tier)`;
}

export interface ExamGroup {
  id: string
  name: string
  slug: string
  description?: string
}

export interface Subject {
  id: string
  exam_group_id: string
  name: string
  slug: string
  description?: string
}

export interface Chapter {
  id: string
  subject_id: string
  name: string
  slug: string
  order_index: number
}

export interface SubChapter {
  id: string
  chapter_id: string
  name: string
  slug: string
  order_index: number
}

export interface Topic {
  id: string
  sub_chapter_id: string
  title: string
  slug: string
  order_index: number
}

export interface NoteVariant {
  type: string
  label: string
  note: string
}

export interface LockedPayload {
  statements?: string[]
  bullet_points?: string[]
  examples?: string[]
  past_year_questions?: string[]
}