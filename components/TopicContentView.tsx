"use client";

import { useMemo, useState } from "react";
import LockedSection from "./learn/LockedSection";
import type { AccessLevel, ContentItem, LockedPayload } from "@/lib/types";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";
import { isContentLockedFor } from "@/lib/access";

interface TopicContentViewProps {
  content: ContentItem | null;
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
    content.variants.length > 0
      ? ["Type 1", ...content.variants.map((v) => v.label || v.type)]
      : ["Type 1"];

  const activeIndex = Math.min(activeVariant, labels.length - 1);

  // Type 1 is the canonical locked_payload; variant index i>=1 maps to
  // content.variants[i-1].
  const activeVariantContent =
    !locked && content.variants.length > 0
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
                __html: content.locked_payload
                  ? renderLockedPayload(content.locked_payload)
                  : "",
              }}
            />
          ) : activeVariantContent ? (
            <div
              className="locked-payload"
              data-testid="locked-payload"
              dangerouslySetInnerHTML={{ __html: activeVariantContent.note }}
            />
          ) : (
            <div
              className="locked-payload"
              data-testid="locked-payload"
              dangerouslySetInnerHTML={{ __html: renderLockedPayload(content.locked_payload) }}
            />
          )}
        </section>
      </article>
    </div>
  );
}

function renderLockedPayload(payload: LockedPayload): string {
  const parts: string[] = [];
  if (payload.statements?.length) {
    parts.push("<h3>Statements</h3><ul>" + payload.statements.map((s) => `<li>${s}</li>`).join("") + "</ul>");
  }
  if (payload.bullet_points?.length) {
    parts.push("<h3>Bullet points</h3><ul>" + payload.bullet_points.map((b) => `<li>${b}</li>`).join("") + "</ul>");
  }
  if (payload.examples?.length) {
    parts.push("<h3>Examples</h3><ul>" + payload.examples.map((e) => `<li>${e}</li>`).join("") + "</ul>");
  }
  if (payload.past_year_questions?.length) {
    parts.push("<h3>Past year questions</h3><ul>" + payload.past_year_questions.map((q) => `<li>${q}</li>`).join("") + "</ul>");
  }
  return parts.join("");
}