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

export function maskedTitle(requiredLevel: AccessLevel): string {
  return `Locked content (${ACCESS_LEVEL_LABELS[requiredLevel]} tier)`;
}
