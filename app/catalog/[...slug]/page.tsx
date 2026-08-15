"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TopicContentView } from "@/components/TopicContentView";
import type {
  BreadcrumbEntry,
  ContentItemDetail,
  ExamGroupNode,
  SubjectNode,
  ChapterNode,
  SubChapterNode,
  TopicNode,
} from "@/lib/types";

interface CatalogSlugPageProps {
  params: Promise<{ slug: string[] }>;
}

interface HierarchyResponse {
  data: ExamGroupNode[];
  user_access_level: number;
}

interface ResolvedPath {
  group: ExamGroupNode;
  subject?: SubjectNode;
  chapter?: ChapterNode;
  subChapter?: SubChapterNode;
  topic?: TopicNode;
}

/**
 * Catalog catch-all route — handles all hierarchy depths 1-5:
 *
 *   /catalog/[group]                                  -> depth 1: subjects
 *   /catalog/[group]/[subject]                        -> depth 2: chapters
 *   /catalog/[group]/[subject]/[chapter]              -> depth 3: sub-chapters
 *   /catalog/[group]/[subject]/[chapter]/[sub]        -> depth 4: topics
 *   /catalog/[group]/[subject]/[chapter]/[sub]/[topic]-> depth 5: TopicContentView
 *
 * The full hierarchy is fetched client-side from /api/hierarchy (same as
 * HierarchyExplorer). For depth 5 the content item is fetched via
 * /api/content/[id] so the DB gate decides whether locked_payload/variants
 * are returned (real user access level).
 *
 * This page renders inside app/catalog/layout.tsx which already provides
 * SiteHeader + CatalogSidebar + the .page-shell wrapper.
 */
export default function CatalogSlugPage({ params }: CatalogSlugPageProps) {
  const [slug, setSlug] = useState<string[]>([]);
  const [hierarchy, setHierarchy] = useState<ExamGroupNode[] | null>(null);
  const [userAccessLevel, setUserAccessLevel] = useState(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentDetail, setContentDetail] = useState<ContentItemDetail | null>(
    null
  );
  const [contentLoading, setContentLoading] = useState(false);

  // Resolve the dynamic route params (Next.js 15 async params).
  useEffect(() => {
    let cancelled = false;
    async function resolveParams() {
      const { slug: paramsSlug } = await params;
      if (!cancelled) setSlug(paramsSlug ?? []);
    }
    void resolveParams();
    return () => {
      cancelled = true;
    };
  }, [params]);

  // Fetch the full hierarchy client-side (same as HierarchyExplorer).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/hierarchy");
        if (!res.ok) throw new Error(`API responded with ${res.status}`);
        const json = (await res.json()) as HierarchyResponse;
        if (!cancelled) {
          setHierarchy(json.data ?? []);
          setUserAccessLevel(json.user_access_level ?? 4);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load hierarchy"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const depth = slug.length;

  // Walk the hierarchy by slug path.
  function resolvePath(): ResolvedPath | null {
    if (!hierarchy || depth === 0) return null;
    const group = hierarchy.find((g) => g.slug === slug[0]);
    if (!group) return null;
    if (depth === 1) return { group };

    const subject = group.subjects?.find((s) => s.slug === slug[1]);
    if (!subject) return null;
    if (depth === 2) return { group, subject };

    const chapter = subject.chapters?.find((c) => c.slug === slug[2]);
    if (!chapter) return null;
    if (depth === 3) return { group, subject, chapter };

    const subChapter = chapter.sub_chapters?.find((sc) => sc.slug === slug[3]);
    if (!subChapter) return null;
    if (depth === 4) return { group, subject, chapter, subChapter };

    const topic = subChapter.topics?.find((t) => t.slug === slug[4]);
    if (!topic) return null;
    return { group, subject, chapter, subChapter, topic };
  }

  const resolved = resolvePath();
  const topicId = resolved?.topic?.content_items?.[0]?.id ?? null;

  // For depth 5, fetch the full content item via /api/content/[id] so we get
  // access_level, public_teaser, locked_payload, variants, owner_contact.
  // The API calls the SECURITY DEFINER RPC — the DB decides whether the 90%
  // payload comes back based on the real user access level.
  useEffect(() => {
    if (depth !== 5 || !topicId) return;
    let cancelled = false;
    setContentLoading(true);
    setContentDetail(null);

    async function loadContent() {
      try {
        const res = await fetch(`/api/content/${topicId}`);
        if (!res.ok) throw new Error(`API responded with ${res.status}`);
        const json = (await res.json()) as { data?: ContentItemDetail };
        if (!cancelled) setContentDetail(json.data ?? null);
      } catch {
        if (!cancelled) setContentDetail(null);
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    }

    void loadContent();
    return () => {
      cancelled = true;
    };
  }, [depth, topicId]);

  // Build breadcrumbs from the resolved path.
  function buildBreadcrumbs(): BreadcrumbEntry[] {
    if (!resolved) return [];
    const crumbs: BreadcrumbEntry[] = [
      { label: "Catalog", href: "/catalog" },
      { label: resolved.group.name, href: `/catalog/${resolved.group.slug}` },
    ];
    if (resolved.subject) {
      crumbs.push({
        label: resolved.subject.name,
        href: `/catalog/${resolved.group.slug}/${resolved.subject.slug}`,
      });
    }
    if (resolved.chapter) {
      crumbs.push({
        label: resolved.chapter.name,
        href: `/catalog/${resolved.group.slug}/${resolved.subject!.slug}/${resolved.chapter.slug}`,
      });
    }
    if (resolved.subChapter) {
      crumbs.push({
        label: resolved.subChapter.name,
        href: `/catalog/${resolved.group.slug}/${resolved.subject!.slug}/${resolved.chapter!.slug}/${resolved.subChapter.slug}`,
      });
    }
    if (resolved.topic) {
      crumbs.push({
        label: resolved.topic.name,
        href: `/catalog/${resolved.group.slug}/${resolved.subject!.slug}/${resolved.chapter!.slug}/${resolved.subChapter!.slug}/${resolved.topic.slug}`,
      });
    }
    return crumbs;
  }

  const breadcrumbs = buildBreadcrumbs();

  if (loading) {
    return (
      <div className="catalog-page" aria-busy="true">
        <div className="card-skeleton" />
        <div className="card-skeleton" />
        <div className="card-skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-page">
        <p className="muted">{error}</p>
      </div>
    );
  }

  if (depth < 1 || depth > 5 || !resolved) {
    return notFound();
  }

  return (
    <div className="catalog-page">
      <BreadcrumbBar crumbs={breadcrumbs} />

      {depth === 1 && resolved.group && (
        <section className="content-section">
          <h1>{resolved.group.name}</h1>
          {resolved.group.description && (
            <p className="muted">{resolved.group.description}</p>
          )}
          <div className="exam-group-grid">
            {(resolved.group.subjects ?? []).map((subject) => (
              <Link
                key={subject.id}
                href={`/catalog/${resolved.group.slug}/${subject.slug}`}
                className="exam-group-card card"
              >
                <h3 className="exam-group-card-title">{subject.name}</h3>
                {subject.description && (
                  <p className="exam-group-card-desc">{subject.description}</p>
                )}
                <div className="exam-group-card-meta">
                  <span className="exam-group-card-count">
                    {subject.chapters?.length ?? 0} chapter
                    {(subject.chapters?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                  <span className="exam-group-card-arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {depth === 2 && resolved.subject && (
        <section className="content-section">
          <h1>{resolved.subject.name}</h1>
          {resolved.subject.description && (
            <p className="muted">{resolved.subject.description}</p>
          )}
          <div className="subject-quick-grid">
            {(resolved.subject.chapters ?? []).map((chapter) => (
              <Link
                key={chapter.id}
                href={`/catalog/${resolved.group.slug}/${resolved.subject!.slug}/${chapter.slug}`}
                className="quick-card card"
              >
                <span className="quick-card-icon">📖</span>
                <div className="quick-card-content">
                  <h3>{chapter.name}</h3>
                  {chapter.description && <p>{chapter.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {depth === 3 && resolved.chapter && (
        <section className="content-section">
          <h1>{resolved.chapter.name}</h1>
          {resolved.chapter.description && (
            <p className="muted">{resolved.chapter.description}</p>
          )}
          <div className="subject-quick-grid">
            {(resolved.chapter.sub_chapters ?? []).map((sub) => (
              <Link
                key={sub.id}
                href={`/catalog/${resolved.group.slug}/${resolved.subject!.slug}/${resolved.chapter!.slug}/${sub.slug}`}
                className="quick-card card"
              >
                <span className="quick-card-icon">📁</span>
                <div className="quick-card-content">
                  <h3>{sub.name}</h3>
                  {sub.description && <p>{sub.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {depth === 4 && resolved.subChapter && (
        <section className="content-section">
          <h1>{resolved.subChapter.name}</h1>
          {resolved.subChapter.description && (
            <p className="muted">{resolved.subChapter.description}</p>
          )}
          <div className="topic-grid">
            {(resolved.subChapter.topics ?? []).map((topic) => (
              <Link
                key={topic.id}
                href={`/catalog/${resolved.group.slug}/${resolved.subject!.slug}/${resolved.chapter!.slug}/${resolved.subChapter!.slug}/${topic.slug}`}
                className="card topic-card"
              >
                <h3 className="card-title">{topic.name}</h3>
                {topic.description && (
                  <p className="card-description">{topic.description}</p>
                )}
                <div className="topic-card-meta">
                  <span className="topic-card-count">
                    {topic.content_items?.length ?? 0} note
                    {(topic.content_items?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                  {topic.content_items?.[0] &&
                    topic.content_items[0].access_level < 4 && (
                      <span className="badge badge-locked">
                        {`Tier ${topic.content_items[0].access_level}+`}
                      </span>
                    )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {depth === 5 && resolved.topic && (
        <section className="content-section viewer-section">
          <h1>{resolved.topic.name}</h1>
          {resolved.topic.description && (
            <p className="muted">{resolved.topic.description}</p>
          )}
          {contentLoading ? (
            <div className="card-skeleton viewer-skeleton" />
          ) : (
            <TopicContentView
              content={contentDetail}
              userAccessLevel={userAccessLevel}
            />
          )}
        </section>
      )}
    </div>
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