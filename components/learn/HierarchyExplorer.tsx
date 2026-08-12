"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  ExamGroupNode,
  SubjectNode,
  ChapterNode,
  SubChapterNode,
  TopicNode,
} from "@/lib/types";

interface HierarchyExplorerProps {
  /** Optional server-selected group slug (from /learn/[group]) to expand initially. */
  initialGroupSlug?: string | null;
}

type HierarchyState = ExamGroupNode[] | null;

/**
 * The syllabus-map explorer. Renders:
 *   - A nested sidebar menu: Exam Group -> Subject -> Chapter -> Sub-Chapter
 *     -> Topic (all open; cards/covers are NEVER locked — navigation is free).
 *   - The main pane lists the topics/content items for the focused node.
 *
 * Content-items link to /learn/[group]/[subject]/[chapter]/[sub]/[topic]/[item]
 * where the in-content 10%/90% lock lives.
 */
export default function HierarchyExplorer({
  initialGroupSlug,
}: HierarchyExplorerProps) {
  const [tree, setTree] = useState<HierarchyState>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/hierarchy");
        const json = await res.json();
        if (!cancelled) {
          setTree(json.data ?? []);
          // Auto-expand the initial group (e.g. /learn/loksewa).
          if (initialGroupSlug) {
            setExpanded(new Set([initialGroupSlug]));
          }
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
  }, [initialGroupSlug]);

  if (loading) {
    return (
      <div className="explorer" aria-busy="true">
        <aside className="explorer-sidebar">
          <div className="card-skeleton" />
          <div className="card-skeleton" />
          <div className="card-skeleton" />
        </aside>
      </div>
    );
  }

  return (
    <div className="explorer" data-testid="hierarchy-explorer">
      <aside className="explorer-sidebar">
        <h2 className="explorer-sidebar-title">Syllabus Map</h2>
        <nav aria-label="Syllabus navigation">
          {(tree ?? []).map((group) => (
            <GroupItem
              key={group.id}
              group={group}
              expanded={expanded}
              onToggle={(slug) => {
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(slug)) next.delete(slug);
                  else next.add(slug);
                  return next;
                });
              }}
            />
          ))}
        </nav>
      </aside>

      <section className="explorer-content">
        <h1 className="explorer-heading">
          Browse the syllabus — every cover is open
        </h1>
        <p className="explorer-sub">
          Titles, cards and the full syllabus map are open to everyone. Only the
          in-content 90% notes are tier-gated.
        </p>
        {renderTopics(tree)}
      </section>
    </div>
  );

  /** Renders all topic cards in the tree (flat, grouped under their topic). */
  function renderTopics(tree: HierarchyState) {
    if (!tree || tree.length === 0) {
      return <p className="explorer-empty">No content available yet.</p>;
    }

    const cards: Array<{ path: string[]; topic: TopicNode }> = [];
    for (const group of tree) {
      for (const subject of group.subjects ?? []) {
        for (const chapter of subject.chapters ?? []) {
          for (const sub of chapter.sub_chapters ?? []) {
            for (const topic of sub.topics ?? []) {
              cards.push({
                path: [group.slug, subject.slug, chapter.slug, sub.slug],
                topic,
              });
            }
          }
        }
      }
    }

    if (cards.length === 0) {
      return (
        <p className="explorer-empty">The syllabus map is empty right now.</p>
      );
    }

    return (
      <div className="topic-grid">
        {cards.map(({ path, topic }) => (
          <TopicCard key={topic.id} topic={topic} path={path} />
        ))}
      </div>
    );
  }
}

function GroupItem({
  group,
  expanded,
  onToggle,
}: {
  group: ExamGroupNode;
  expanded: Set<string>;
  onToggle: (slug: string) => void;
}) {
  const open = expanded.has(group.slug);
  return (
    <div className="nav-group" data-testid={`nav-group-${group.slug}`}>
      <button
        type="button"
        className="nav-group-toggle"
        aria-expanded={open}
        onClick={() => onToggle(group.slug)}
      >
        <span className="nav-caret">{open ? "▾" : "▸"}</span>
        {group.name}
      </button>
      {open && (
        <div className="nav-group-children">
          {group.subjects?.map((subject) => (
            <SubjectItem key={subject.id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectItem({ subject }: { subject: SubjectNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="nav-subject">
      <button
        type="button"
        className="nav-subject-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-caret">{open ? "▾" : "▸"}</span>
        {subject.name}
      </button>
      {open &&
        subject.chapters?.map((chapter) => (
          <ChapterItem key={chapter.id} chapter={chapter} />
        ))}
    </div>
  );
}

function ChapterItem({ chapter }: { chapter: ChapterNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="nav-chapter">
      <button
        type="button"
        className="nav-chapter-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-caret">{open ? "▾" : "▸"}</span>
        {chapter.name}
      </button>
      {open &&
        chapter.sub_chapters?.map((sub) => (
          <SubChapterItem key={sub.id} sub={sub} />
        ))}
    </div>
  );
}

function SubChapterItem({ sub }: { sub: SubChapterNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="nav-sub-chapter">
      <button
        type="button"
        className="nav-sub-chapter-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-caret">{open ? "▾" : "▸"}</span>
        {sub.name}
      </button>
      {open &&
        sub.topics?.map((topic) => (
          <div key={topic.id} className="nav-topic">
            <span className="nav-topic-name">{topic.name}</span>
          </div>
        ))}
    </div>
  );
}

function TopicCard({
  topic,
  path,
}: {
  topic: TopicNode;
  path: string[];
}) {
  const item = topic.content_items?.[0] ?? null;
  const href = item
    ? `/learn/${path.join("/")}/${topic.slug}/${item.id}`
    : "#";

  return (
    <article className="card topic-card" data-testid="topic-card">
      <h3 className="card-title">{topic.name}</h3>
      {topic.description && (
        <p className="card-description">{topic.description}</p>
      )}
      {item ? (
        <div className="topic-card-meta">
          <span className="topic-card-count">
            {topic.content_items.length} note
            {topic.content_items.length === 1 ? "" : "s"}
          </span>
          {item.access_level < 4 && (
            <span className="badge badge-locked">
              {`Tier ${item.access_level}+`}
            </span>
          )}
        </div>
      ) : (
        <p className="card-description">—</p>
      )}
      {item && (
        <Link href={href} className="btn btn-primary btn-sm">
          Open topic
        </Link>
      )}
    </article>
  );
}