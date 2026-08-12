"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ExamGroupNode, SubjectNode, ChapterNode, SubChapterNode } from "@/lib/types";

interface CatalogSidebarProps {
  /** Optional initial data to avoid waterfalls. If not provided, fetches from API. */
  initialData?: ExamGroupNode[] | null;
}

type HierarchyState = ExamGroupNode[] | null;

/**
 * Catalog Navigation Sidebar — renders a collapsible tree of the full hierarchy:
 *   Exam Group → Subject → Chapter → Sub-Chapter → Topic
 *
 * Features:
 *   - Fetches from /api/hierarchy (or receives initialData props)
 *   - Expandable/collapsible accordion at each level
 *   - Highlights the currently active item based on URL path
 *   - Clean links to /catalog/[examGroupSlug]/[subjectSlug]/[chapterSlug]/[subChapterSlug]/[topicSlug]
 *   - Responsive: sticky on desktop, collapsible drawer on mobile
 */
export default function CatalogSidebar({ initialData }: CatalogSidebarProps) {
  const [tree, setTree] = useState<HierarchyState>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Expanded state: tracks which nodes are open at each level
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedSubChapters, setExpandedSubChapters] = useState<Set<string>>(new Set());

  // Fetch hierarchy data on mount (if not provided via props)
  useEffect(() => {
    if (initialData !== undefined) {
      setTree(initialData);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/hierarchy");
        const json = await res.json();
        if (!cancelled) {
          setTree(json.data ?? []);
        }
      } catch {
        if (!cancelled) setTree([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [initialData]);

  // Auto-expand path based on current URL
  // URL pattern: /catalog/[group]/[subject]/[chapter]/[sub]/[topic]
  useEffect(() => {
    if (!tree) return;

    const match = pathname.match(
      /^\/catalog\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/
    );
    if (!match) {
      // If on /catalog root, expand nothing or first level
      return;
    }

    const [, groupSlug, subjectSlug, chapterSlug, subChapterSlug] = match;

    // Find and expand the path through the tree
    for (const group of tree) {
      if (group.slug === groupSlug) {
        setExpandedGroups((prev) => new Set(prev).add(groupSlug));
        for (const subject of group.subjects ?? []) {
          if (subject.slug === subjectSlug) {
            setExpandedSubjects((prev) => new Set(prev).add(subjectSlug));
            for (const chapter of subject.chapters ?? []) {
              if (chapter.slug === chapterSlug) {
                setExpandedChapters((prev) => new Set(prev).add(chapterSlug));
                for (const sub of chapter.sub_chapters ?? []) {
                  if (sub.slug === subChapterSlug) {
                    setExpandedSubChapters((prev) => new Set(prev).add(subChapterSlug));
                  }
                }
              }
            }
          }
        }
      }
    }
  }, [pathname, tree]);

  const isActivePath = useCallback(
    (slug: string, level: "group" | "subject" | "chapter" | "subChapter" | "topic") => {
      const segments = pathname.split("/").filter(Boolean);
      // /catalog/group/subject/chapter/sub/topic
      const indexMap = { group: 1, subject: 2, chapter: 3, subChapter: 4, topic: 5 };
      const index = indexMap[level];
      return segments[index] === slug;
    },
    [pathname]
  );

  const toggleGroup = (slug: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleSubject = (slug: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleChapter = (slug: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleSubChapter = (slug: string) => {
    setExpandedSubChapters((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  // Mobile drawer toggle
  const handleMobileToggle = () => setMobileOpen((v) => !v);

  if (loading) {
    return (
      <>
        {/* Mobile toggle button */}
        <button
          className="catalog-sidebar-mobile-toggle"
          onClick={handleMobileToggle}
          aria-expanded={mobileOpen}
          aria-controls="catalog-sidebar"
        >
          <span className="catalog-sidebar-toggle-icon">☰</span>
          Browse Catalog
        </button>
        {/* Mobile overlay */}
        <div className="catalog-sidebar-loading">
          <div className="card-skeleton" />
          <div className="card-skeleton" />
          <div className="card-skeleton" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile toggle button (visible only on mobile) */}
      <button
        className="catalog-sidebar-mobile-toggle"
        onClick={handleMobileToggle}
        aria-expanded={mobileOpen}
        aria-controls="catalog-sidebar"
      >
        <span className="catalog-sidebar-toggle-icon">☰</span>
        Browse Catalog
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="catalog-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="catalog-sidebar"
        className={`catalog-sidebar${mobileOpen ? " catalog-sidebar-open" : ""}`}
        aria-label="Catalog navigation"
      >
        <div className="catalog-sidebar-header">
          <h2 className="catalog-sidebar-title">Catalog</h2>
          <button
            className="catalog-sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav aria-label="Catalog hierarchy">
          {(tree ?? []).map((group) => (
            <GroupItem
              key={group.id}
              group={group}
              expanded={expandedGroups}
              onToggle={toggleGroup}
              isActivePath={isActivePath}
              pathname={pathname}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}

// ─── Group Level ───────────────────────────────────────────────────────────

function GroupItem({
  group,
  expanded,
  onToggle,
  isActivePath,
  pathname,
}: {
  group: ExamGroupNode;
  expanded: Set<string>;
  onToggle: (slug: string) => void;
  isActivePath: (slug: string, level: "group" | "subject" | "chapter" | "subChapter" | "topic") => boolean;
  pathname: string;
}) {
  const open = expanded.has(group.slug);
  const isActive = isActivePath(group.slug, "group");

  return (
    <div className="catalog-nav-group">
      <button
        type="button"
        className={`catalog-nav-toggle${isActive ? " catalog-nav-active" : ""}`}
        aria-expanded={open}
        onClick={() => onToggle(group.slug)}
      >
        <span className="catalog-nav-caret">{open ? "▾" : "▸"}</span>
        <span className="catalog-nav-label">{group.name}</span>
      </button>
      {open && (
        <div className="catalog-nav-children">
          {(group.subjects ?? []).map((subject) => (
            <SubjectItem
              key={subject.id}
              subject={subject}
              groupSlug={group.slug}
              expanded={expanded}
              onToggle={onToggle}
              isActivePath={isActivePath}
              pathname={pathname}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Subject Level ─────────────────────────────────────────────────────────

function SubjectItem({
  subject,
  groupSlug,
  expanded,
  onToggle,
  isActivePath,
  pathname,
}: {
  subject: SubjectNode;
  groupSlug: string;
  expanded: Set<string>;
  onToggle: (slug: string) => void;
  isActivePath: (slug: string, level: "group" | "subject" | "chapter" | "subChapter" | "topic") => boolean;
  pathname: string;
}) {
  const open = expanded.has(subject.slug);
  const isActive = isActivePath(subject.slug, "subject");
  const href = `/catalog/${groupSlug}/${subject.slug}`;

  return (
    <div className="catalog-nav-subject">
      <button
        type="button"
        className={`catalog-nav-sub-toggle${isActive ? " catalog-nav-active" : ""}`}
        aria-expanded={open}
        onClick={() => onToggle(subject.slug)}
      >
        <span className="catalog-nav-caret">{open ? "▾" : "▸"}</span>
        <span className="catalog-nav-label">{subject.name}</span>
      </button>
      {open && (
        <div className="catalog-nav-children">
          {(subject.chapters ?? []).map((chapter) => (
            <ChapterItem
              key={chapter.id}
              chapter={chapter}
              groupSlug={groupSlug}
              subjectSlug={subject.slug}
              expanded={expanded}
              onToggle={onToggle}
              isActivePath={isActivePath}
              pathname={pathname}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chapter Level ─────────────────────────────────────────────────────────

function ChapterItem({
  chapter,
  groupSlug,
  subjectSlug,
  expanded,
  onToggle,
  isActivePath,
  pathname,
}: {
  chapter: ChapterNode;
  groupSlug: string;
  subjectSlug: string;
  expanded: Set<string>;
  onToggle: (slug: string) => void;
  isActivePath: (slug: string, level: "group" | "subject" | "chapter" | "subChapter" | "topic") => boolean;
  pathname: string;
}) {
  const open = expanded.has(chapter.slug);
  const isActive = isActivePath(chapter.slug, "chapter");

  return (
    <div className="catalog-nav-chapter">
      <button
        type="button"
        className={`catalog-nav-sub-toggle${isActive ? " catalog-nav-active" : ""}`}
        aria-expanded={open}
        onClick={() => onToggle(chapter.slug)}
      >
        <span className="catalog-nav-caret">{open ? "▾" : "▸"}</span>
        <span className="catalog-nav-label">{chapter.name}</span>
      </button>
      {open && (
        <div className="catalog-nav-children">
          {(chapter.sub_chapters ?? []).map((sub) => (
            <SubChapterItem
              key={sub.id}
              sub={sub}
              groupSlug={groupSlug}
              subjectSlug={subjectSlug}
              chapterSlug={chapter.slug}
              expanded={expanded}
              onToggle={onToggle}
              isActivePath={isActivePath}
              pathname={pathname}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-Chapter Level ─────────────────────────────────────────────────────

function SubChapterItem({
  sub,
  groupSlug,
  subjectSlug,
  chapterSlug,
  expanded,
  onToggle,
  isActivePath,
  pathname,
}: {
  sub: SubChapterNode;
  groupSlug: string;
  subjectSlug: string;
  chapterSlug: string;
  expanded: Set<string>;
  onToggle: (slug: string) => void;
  isActivePath: (slug: string, level: "group" | "subject" | "chapter" | "subChapter" | "topic") => boolean;
  pathname: string;
}) {
  const open = expanded.has(sub.slug);
  const isActive = isActivePath(sub.slug, "subChapter");

  return (
    <div className="catalog-nav-sub-chapter">
      <button
        type="button"
        className={`catalog-nav-sub-toggle${isActive ? " catalog-nav-active" : ""}`}
        aria-expanded={open}
        onClick={() => onToggle(sub.slug)}
      >
        <span className="catalog-nav-caret">{open ? "▾" : "▸"}</span>
        <span className="catalog-nav-label">{sub.name}</span>
      </button>
      {open && (
        <div className="catalog-nav-children">
          {(sub.topics ?? []).map((topic) => {
            const topicHref = `/catalog/${groupSlug}/${subjectSlug}/${chapterSlug}/${sub.slug}/${topic.slug}`;
            const topicActive = isActivePath(topic.slug, "topic");
            return (
              <Link
                key={topic.id}
                href={topicHref}
                className={`catalog-nav-topic${topicActive ? " catalog-nav-active" : ""}`}
              >
                {topic.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}