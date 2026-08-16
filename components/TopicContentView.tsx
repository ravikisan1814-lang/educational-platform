"use client";

import { useMemo, useState } from "react";
import LockedSection from "./learn/LockedSection";
import type { ContentItemDetail } from "@/lib/types";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";
import { isContentLockedFor } from "@/lib/access";

interface TopicContentViewProps {
  content: ContentItemDetail | null;
  userAccessLevel: number;
}

export function TopicContentView({
  content,
  userAccessLevel,
}: TopicContentViewProps) {
  const [activeVariant, setActiveVariant] = useState(0);

  const locked = useMemo(
    () =>
      content
        ? isContentLockedFor(
            userAccessLevel as 1 | 2 | 3 | 4,
            content.access_level as 1 | 2 | 3 | 4
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
              ? `${ACCESS_LEVEL_LABELS[content.access_level as 1 | 2 | 3 | 4]} tier`
              : "Open"}
          </span>
        </header>

        {content.public_teaser ? (
          <section
            className="public-concept"
            data-testid="public-concept"
            dangerouslySetInnerHTML={{ __html: content.public_teaser }}
          />
        ) : null}

        <section id="variant-panel" role="tabpanel" className="variant-panel">
          {locked ? (
            <LockedSection
              requiredAccessLevel={content.access_level as 1 | 2 | 3 | 4}
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
              dangerouslySetInnerHTML={{ __html: content.locked_payload ?? "" }}
            />
          )}
        </section>
      </article>
    </div>
  );
}