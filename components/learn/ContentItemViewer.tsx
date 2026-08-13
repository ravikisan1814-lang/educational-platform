"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VariantTabs from "./VariantTabs";
import LockedSection from "./LockedSection";
import type { ContentItemDetail, BreadcrumbEntry } from "@/lib/types";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";
import {
  sectionLabelForBlockType,
  sectionKeyForBlockType,
} from "@/lib/access";
import { BLOCK_TYPE_STYLES, BLOCK_RENDERER_HINTS } from "@/lib/content-structure";

interface ContentItemViewerProps {
  itemId: string;
  breadcrumbs: BreadcrumbEntry[];
}

/**
 * Topic-page viewer for a single content item.
 *
 * Renders:
 *   1. Breadcrumb (Exam Group -> Subject -> Chapter -> Sub-Chapter -> Topic).
 *   2. The 10% public concept (public_teaser) — always open.
 *   3. The variant tab bar ([ Type 1 ] [ Type 2 ] [ Type 3 ]) with smooth
 *      switching. Item is fetched through /api/content/[id], which calls the
 *      SECURITY DEFINER RPC — the DB decides whether locked_payload/variants
 *      come back.
 *   4. The 90% body: full unlocked content, OR the LockedSection blur overlay
 *      with [ Access it ] / [ Contact with owner ].
 *
 * Notes-architecture styling: the block_type drives the accent color + label
 * chip + section label, and special renderer hints (qa/chips/pills/...) select
 * the body layout (integrated from the ravikishan BlockRenderer contract).
 *
 * Security: when is_locked is true the API returns null for
 * locked_payload/variants, so the client never holds the raw 90%.
 */
export default function ContentItemViewer({
  itemId,
  breadcrumbs,
}: ContentItemViewerProps) {
  const [detail, setDetail] = useState<ContentItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVariant, setActiveVariant] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setActiveVariant(0);

    async function load() {
      try {
        const res = await fetch(`/api/content/${itemId}`);
        if (!res.ok) {
          throw new Error(`API responded with ${res.status}`);
        }
        const json = (await res.json()) as { data?: ContentItemDetail };
        if (cancelled) return;
        setDetail(json.data ?? null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  if (loading) {
    return (
      <div className="viewer" aria-busy="true">
        <BreadcrumbBar crumbs={breadcrumbs} />
        <div className="card-skeleton viewer-skeleton" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="viewer">
        <BreadcrumbBar crumbs={breadcrumbs} />
        <div className="card viewer-error">
          <p>{error ?? "Content not found."}</p>
        </div>
      </div>
    );
  }

  const labels = detail.variant_labels.length > 0
    ? detail.variant_labels
    : ["Type 1"];

  // Type 1 is the canonical locked_payload; variant index i>=1 maps to
  // detail.variants[i-1]. When locked, variants is null so all tabs show
  // the LockedSection (no content leak).
  const isLocked = detail.is_locked;
  const activeIndex = Math.min(activeVariant, labels.length - 1);
  const activeVariantContent =
    !isLocked && detail.variants && detail.variants.length > 0
      ? detail.variants[activeIndex - 1] ?? null
      : null;

  // Notes-architecture block metadata
  const blockType = detail.block_type ?? "note_concept";
  const blockStyle = BLOCK_TYPE_STYLES[blockType] ?? BLOCK_TYPE_STYLES.note_concept;
  const sectionLabel = sectionLabelForBlockType(detail.block_type);
  const sectionKey = sectionKeyForBlockType(detail.block_type);
  const rendererHint = BLOCK_RENDERER_HINTS[blockType] ?? null;

  return (
    <div className="viewer" data-testid="content-item-viewer">
      <BreadcrumbBar crumbs={breadcrumbs} />

      <article className="content-item">
        <header className="content-item-header">
          <div className="block-type-row">
            <span
              className="block-type-chip"
              style={{
                color: blockStyle.color,
                borderColor: `${blockStyle.color}44`,
                background: `${blockStyle.color}14`,
              }}
            >
              {blockStyle.label}
            </span>
            <span className={`section-chip section-chip-${sectionKey}`}>
              {sectionLabel}
            </span>
            {detail.note_type ? (
              <span className="note-type-chip">Type {detail.note_type}</span>
            ) : null}
          </div>
          <h1 className="content-item-title">{detail.title}</h1>
          <span
            className={`badge ${isLocked ? "badge-locked" : "badge-open"}`}
          >
            {isLocked
              ? `${ACCESS_LEVEL_LABELS[detail.access_level]} tier`
              : "Open"}
          </span>
        </header>

        {/* 10% public concept — always visible */}
        <section
          className="public-concept"
          data-testid="public-concept"
          dangerouslySetInnerHTML={{ __html: detail.public_teaser }}
        />

        {/* Variant engine — Type 1 / Type 2 / Type 3 tabs */}
        <VariantTabs
          labels={labels}
          activeIndex={activeIndex}
          onSelect={setActiveVariant}
          locked={isLocked}
        />

        {/* 90% body */}
        <section id="variant-panel" role="tabpanel" className="variant-panel">
          {isLocked ? (
            <LockedSection
              requiredAccessLevel={detail.access_level}
              ownerContact={detail.owner_contact}
            />
          ) : activeIndex === 0 ? (
            <BlockBody
              blockType={blockType}
              hint={rendererHint}
              accentColor={blockStyle.color}
              html={detail.locked_payload ?? ""}
            />
          ) : activeVariantContent ? (
            <BlockBody
              blockType={blockType}
              hint={rendererHint}
              accentColor={blockStyle.color}
              html={activeVariantContent.content}
            />
          ) : (
            <BlockBody
              blockType={blockType}
              hint={rendererHint}
              accentColor={blockStyle.color}
              html={detail.locked_payload ?? ""}
            />
          )}
        </section>
      </article>
    </div>
  );
}

/**
 * Notes-architecture block body renderer. Wraps the shared HTML payload in a
 * block card styled by block type, with the ravikishan special-body layouts:
 *   qa      — split on Problem:/Solution:/Answer: labels
 *   chips   — keyword pills
 *   pills   — formula pills (centered, accent border)
 *   default — markdown body
 */
function BlockBody({
  blockType,
  hint,
  accentColor,
  html,
}: {
  blockType: string;
  hint: string | null;
  accentColor: string;
  html: string;
}) {
  if (!html) {
    return (
      <div className="locked-payload block-body" data-testid="locked-payload">
        <p className="block-empty">No body content for this block.</p>
      </div>
    );
  }

  if (hint === "qa") {
    return (
      <div
        className="locked-payload block-body block-body-qa"
        data-testid="locked-payload"
        style={{ ["--block-accent" as string]: accentColor }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (hint === "pills" || hint === "chips") {
    return (
      <div
        className="locked-payload block-body block-body-special"
        data-testid="locked-payload"
        style={{ ["--block-accent" as string]: accentColor }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div
      className="locked-payload block-body"
      data-testid="locked-payload"
      style={{ ["--block-accent" as string]: accentColor }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function BreadcrumbBar({ crumbs }: { crumbs: BreadcrumbEntry[] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb" data-testid="breadcrumb">
      <ol>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.href}-${index}`}>
              {isLast ? (
                <span aria-current="page" className="breadcrumb-current">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="breadcrumb-link">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}