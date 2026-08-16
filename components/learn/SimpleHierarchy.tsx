"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ExamGroupNode, SubjectNode, ChapterNode, SubChapterNode, TopicNode, ContentItemSummary } from "@/lib/types";

interface SimpleHierarchyProps {
  /** Path segments after /learn, e.g. ["class-11","chemistry"] */
  path?: string[];
}

type Node = ExamGroupNode | SubjectNode | ChapterNode | SubChapterNode | TopicNode;

export default function SimpleHierarchy({ path = [] }: SimpleHierarchyProps) {
  const [tree, setTree] = useState<ExamGroupNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/hierarchy");
        const json = await res.json();
        if (!cancelled) setTree(json.data ?? []);
      } catch {
        if (!cancelled) setTree([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="simple-hierarchy" aria-busy="true">
        <div className="card-skeleton" />
        <div className="card-skeleton" />
        <div className="card-skeleton" />
      </div>
    );
  }

  if (tree.length === 0) {
    return <p className="explorer-empty">No content available yet.</p>;
  }

  const node = resolveNode(tree, path);

  if (!node) {
    return <p className="explorer-empty">Not found.</p>;
  }

  const items = flattenContent(node);

  return (
    <div className="simple-hierarchy">
      <Breadcrumb path={path} />
      <h1 className="simple-hierarchy-title">{node.name}</h1>
      {node.description && <p className="simple-hierarchy-desc">{node.description}</p>}

      {items.length === 0 && (
        <p className="explorer-empty">No notes published in this section yet.</p>
      )}

      <div className="notes-list">
        {items.map((item) => (
          <article key={item.id} className="note-card">
            <h3 className="note-card-title">{item.title}</h3>
            <div
              className="note-card-teaser"
              dangerouslySetInnerHTML={{ __html: item.public_teaser ?? "" }}
            />
            <div className="note-card-meta">
              <span className={`badge ${item.access_level < 4 ? "badge-locked" : "badge-open"}`}>
                {item.access_level < 4 ? `Tier ${item.access_level}+` : "Open"}
              </span>
              <Link href={`/learn/${[...path, item.topic_id.split("/").pop() ?? item.id].join("/")}/${item.id}`} className="btn btn-primary btn-sm">
                Read notes
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function resolveNode(tree: ExamGroupNode[], path: string[]): Node | null {
  let current: Node[] = tree;
  let node: Node | null = null;

  for (const segment of path) {
    const found = current.find((n) => n.slug === segment);
    if (!found) return null;
    node = found;
    if ("subjects" in found) current = found.subjects ?? [];
    else if ("chapters" in found) current = found.chapters ?? [];
    else if ("sub_chapters" in found) current = found.sub_chapters ?? [];
    else if ("topics" in found) current = found.topics ?? [];
    else current = [];
  }

  return node;
}

function flattenContent(node: Node): ContentItemSummary[] {
  if ("content_items" in node) {
    return node.content_items ?? [];
  }
  if ("topics" in node) {
    return node.topics?.flatMap((t) => t.content_items ?? []) ?? [];
  }
  if ("sub_chapters" in node) {
    return node.sub_chapters?.flatMap((sc) => sc.topics?.flatMap((t) => t.content_items ?? []) ?? []) ?? [];
  }
  if ("chapters" in node) {
    return node.chapters?.flatMap((ch) => ch.sub_chapters?.flatMap((sc) => sc.topics?.flatMap((t) => t.content_items ?? []) ?? []) ?? []) ?? [];
  }
  if ("subjects" in node) {
    return node.subjects?.flatMap((s) => s.chapters?.flatMap((ch) => ch.sub_chapters?.flatMap((sc) => sc.topics?.flatMap((t) => t.content_items ?? []) ?? []) ?? []) ?? []) ?? [];
  }
  return [];
}

function Breadcrumb({ path }: { path: string[] }) {
  const crumbs = [{ label: "Learn", href: "/learn" }];
  let accumulated = "";
  for (const segment of path) {
    accumulated += "/" + segment;
    crumbs.push({ label: segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), href: "/learn" + accumulated });
  }

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href + index}>
              {isLast ? (
                <span aria-current="page" className="breadcrumb-current">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="breadcrumb-link">{crumb.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
