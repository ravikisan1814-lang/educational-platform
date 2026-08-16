"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VariantTabs from "./VariantTabs";
import LockedSection from "./LockedSection";
import VizPanel from "@/components/visuals/VizPanel";
import ThreeScene from "@/components/visuals/ThreeScene";
import type { ContentItemDetail, BreadcrumbEntry, ExamGroupNode } from "@/lib/types";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";

interface ContentItemViewerProps {
  itemId: string;
  breadcrumbs: BreadcrumbEntry[];
}

interface SiblingInfo {
  prev: { id: string; title: string; href: string } | null;
  next: { id: string; title: string; href: string } | null;
}

export default function ContentItemViewer({
  itemId,
  breadcrumbs,
}: ContentItemViewerProps) {
  const [detail, setDetail] = useState<ContentItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVariant, setActiveVariant] = useState(0);
  const [siblings, setSiblings] = useState<SiblingInfo>({ prev: null, next: null });
  const [figureIndex, setFigureIndex] = useState(0);
  const [figures, setFigures] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setActiveVariant(0);
    setFigureIndex(0);
    setSiblings({ prev: null, next: null });

    async function load() {
      try {
        const [contentRes, hierarchyRes] = await Promise.all([
          fetch(`/api/content/${itemId}`),
          fetch("/api/hierarchy"),
        ]);

        if (!contentRes.ok) {
          throw new Error(`API responded with ${contentRes.status}`);
        }

        const json = (await contentRes.json()) as { data?: ContentItemDetail };
        if (cancelled) return;
        setDetail(json.data ?? null);

        if (hierarchyRes.ok) {
          const hierarchyJson = await hierarchyRes.json();
          const sibling = findSiblings(hierarchyJson.data ?? [], itemId);
          if (!cancelled) setSiblings(sibling);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load content");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [itemId]);

  useEffect(() => {
    if (!detail) return;
    const figs: string[] = [];
    const title = detail.title.toLowerCase();
    const slug = title;

    if (slug.includes("graph") || slug.includes("trajectory") || slug.includes("plot")) {
      figs.push("trajectory");
    }
    if (slug.includes("molecular") || slug.includes("molecule") || slug.includes("orbital")) {
      figs.push("molecular");
    }
    if (slug.includes("bar") || slug.includes("chart") || slug.includes("comparison")) {
      figs.push("barchart");
    }
    if (slug.includes("wave") || slug.includes("oscillation") || slug.includes("vibration")) {
      figs.push("wave");
    }
    if (slug.includes("field") || slug.includes("vector") || slug.includes("force")) {
      figs.push("vectorfield");
    }
    if (slug.includes("cell") || slug.includes("biology") || slug.includes("life cycle")) {
      figs.push("cell");
    }
    figs.push("abstract");
    setFigures(figs);
    setFigureIndex(0);
  }, [detail?.title]);

  if (loading) {
    return (
      <div className="viewer" aria-busy="true">
        <nav className="viewer-nav" aria-label="Page navigation">
          <Link href="/" className="nav-btn nav-btn-home">Home</Link>
          <span className="nav-spacer" />
          <span className="nav-spacer" />
        </nav>
        <BreadcrumbBar crumbs={breadcrumbs} />
        <div className="card-skeleton viewer-skeleton" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="viewer">
        <nav className="viewer-nav" aria-label="Page navigation">
          <Link href="/" className="nav-btn nav-btn-home">Home</Link>
          <span className="nav-spacer" />
          <span className="nav-spacer" />
        </nav>
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

  const isLocked = detail.is_locked;
  const activeIndex = Math.min(activeVariant, labels.length - 1);
  const activeVariantContent =
    !isLocked && detail.variants && detail.variants.length > 0
      ? detail.variants[activeIndex - 1] ?? null
      : null;

  const currentFigure = figures.length > 0 ? figures[figureIndex % figures.length] : "abstract";
  const figureLabel = currentFigure.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  return (
    <div className="viewer" data-testid="content-item-viewer">
      <nav className="viewer-nav" aria-label="Page navigation">
        <Link href="/" className="nav-btn nav-btn-home" title="Home">Home</Link>
        {breadcrumbs.length > 1 && (
          <Link href={breadcrumbs[breadcrumbs.length - 2]?.href ?? "#"} className="nav-btn nav-btn-back" title="Back">
            ← Back
          </Link>
        )}
        {siblings.next && (
          <Link href={siblings.next.href} className="nav-btn nav-btn-next" title="Next topic">
            Next →
          </Link>
        )}
      </nav>

      <BreadcrumbBar crumbs={breadcrumbs} />

      <article className="content-item">
        <header className="content-item-header">
          <h1 className="content-item-title">{detail.title}</h1>
          <span
            className={`badge ${isLocked ? "badge-locked" : "badge-open"}`}
          >
            {isLocked
              ? `${ACCESS_LEVEL_LABELS[detail.access_level]} tier`
              : "Open"}
          </span>
        </header>

        <section
          className="public-concept"
          data-testid="public-concept"
          dangerouslySetInnerHTML={{ __html: detail.public_teaser }}
        />

        <VariantTabs
          labels={labels}
          activeIndex={activeIndex}
          onSelect={setActiveVariant}
          locked={isLocked}
        />

        <section id="variant-panel" role="tabpanel" className="variant-panel">
          {isLocked ? (
            <LockedSection
              requiredAccessLevel={detail.access_level}
              ownerContact={detail.owner_contact}
            />
          ) : activeIndex === 0 ? (
            <div
              className="locked-payload"
              data-testid="locked-payload"
              dangerouslySetInnerHTML={{ __html: detail.locked_payload ?? "" }}
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
              dangerouslySetInnerHTML={{ __html: detail.locked_payload ?? "" }}
            />
          )}
        </section>
      </article>

      <section className="visuals-stack" aria-label="Interactive visuals">
        <VizPanel
          title={`Graph / figure: ${figureLabel} (${figureIndex + 1}/${figures.length})`}
          actions={
            figures.length > 1 ? (
              <div className="fig-nav">
                <button
                  type="button"
                  className="fig-nav-btn"
                  onClick={() => setFigureIndex((i) => (i - 1 + figures.length) % figures.length)}
                  aria-label="Previous figure"
                >
                  ← Prev
                </button>
                <span className="fig-nav-label">{figureIndex + 1} / {figures.length}</span>
                <button
                  type="button"
                  className="fig-nav-btn"
                  onClick={() => setFigureIndex((i) => (i + 1) % figures.length)}
                  aria-label="Next figure"
                >
                  Next →
                </button>
              </div>
            ) : undefined
          }
          defaultOpen={true}
        >
          <ThreeScene figureType={currentFigure} topicTitle={detail.title} />
        </VizPanel>
      </section>
    </div>
  );
}

function findSiblings(tree: ExamGroupNode[], currentItemId: string): SiblingInfo {
  for (const group of tree) {
    for (const subject of group.subjects ?? []) {
      for (const chapter of subject.chapters ?? []) {
        for (const sub of chapter.sub_chapters ?? []) {
          const topics = sub.topics ?? [];
          for (let i = 0; i < topics.length; i++) {
            const topic = topics[i];
            const items = topic.content_items ?? [];
            for (let j = 0; j < items.length; j++) {
              if (items[j].id === currentItemId) {
                const prevItem = j > 0 ? items[j - 1] : (i > 0 ? (topics[i - 1].content_items ?? []).slice(-1)[0] : null);
                const nextItem = j < items.length - 1 ? items[j + 1] : (i < topics.length - 1 ? (topics[i + 1].content_items ?? [])[0] : null);
                const makeLink = (item: { id: string; title: string } | null) => item ? { id: item.id, title: item.title, href: `/learn/${group.slug}/${subject.slug}/${chapter.slug}/${sub.slug}/${topic.slug}/${item.id}` } : null;
                return { prev: makeLink(prevItem), next: makeLink(nextItem) };
              }
            }
          }
        }
      }
    }
  }
  return { prev: null, next: null };
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
