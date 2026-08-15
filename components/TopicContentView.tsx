"use client";

import { useMemo, useState } from "react";
import LockedSection from "./learn/LockedSection";
import type { AccessLevel, ContentItemDetail } from "@/lib/types";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";
import { isContentLockedFor } from "@/lib/access";

interface TopicContentViewProps {
  content: ContentItemDetail | null;
  userAccessLevel: number;
}

/**
 * Renders a single content item on a topic page.
 *
 * - Shows the 10% public concept (public_teaser) always.
 * - Renders variant tabs for the item's variants (Type 1..n).
 * - If the user's tier is high enough, shows the full locked payload;
 *   otherwise shows the LockedSection blur overlay. The raw payload is
 *   never passed down when locked — the server only sends what RLS allows.
 *
 * `content` is a ContentItemDetail as returned by GET /api/content/[id]
 * (the SECURITY DEFINER RPC gate). When locked, locked_payload/variants are
 * null so the 90% is never leaked to the client.
 */
export function TopicContentView({
  content,
  userAccessLevel,
}: TopicContentViewProps) {
  const [activeVariant, setActiveVariant] = useState(0);

  const locked = useMemo(
    () =>
      content
        ? isContentLockedFor(
            userAccessLevel as AccessLevel,
            content.access_level as AccessLevel
          )
        : false,
    [content, userAccessLevel]
  );

  if (!content) {
    return (
      <div className="viewer" data-testid="topic-content-view">
        <div className="card viewer-error">
          <p>No content available for this topic yet.</p>
        </div>
      </div>
    );
  }

  const labels =
    content.variant_labels.length > 0
      ? content.variant_labels
      : ["Type 1"];

  const activeIndex = Math.min(activeVariant, labels.length - 1);

  // Type 1 is the canonical locked_payload; variant index i>=1 maps to
  // content.variants[i-1]. When locked, variants is null so all tabs show
  // the LockedSection (no content leak).
  const activeVariantContent =
    !locked && content.variants && content.variants.length > 0
      ? content.variants[activeIndex - 1] ?? null
      : null;

  return (
    <div className="viewer" data-testid="topic-content-view">
      <article className="content-item">
        <header className="content-item-header">
          <h1 className="content-item-title">{content.title}</h1>
          <span
            className={`badge ${locked ? "badge-locked" : "badge-open"}`}
          >
            {locked
              ? `${ACCESS_LEVEL_LABELS[content.access_level as AccessLevel]} tier`
              : "Open"}
          </span>
        </header>

        {/* 10% public concept — always visible */}
        {content.public_teaser ? (
          <section
            className="public-concept"
            data-testid="public-concept"
            dangerouslySetInnerHTML={{ __html: content.public_teaser }}
          />
        ) : null}

        {/* 90% body */}
        <section id="variant-panel" role="tabpanel" className="variant-panel">
          {locked ? (
            <LockedSection
              requiredAccessLevel={content.access_level as AccessLevel}
              ownerContact={content.owner_contact}
            />
          ) : activeIndex === 0 ? (
            <div
              className="locked-payload"
              data-testid="locked-payload"
              dangerouslySetInnerHTML={{
                __html: content.locked_payload ?? "",
              }}
            />
          ) : activeVariantContent ? (
            <div
              className="locked-payload"
              data-testid="locked-payload"
              dangerouslySetInnerHTML={{ __html: activeVariantContent.content }}
            />
          ) : (
            <div
              className="locked-payload"
              data-testid="locked-payload"
              dangerouslySetInnerHTML={{
                __html: content.locked_payload ?? "",
              }}
            />
          )}
        </section>
      </article>
    </div>
  );
}