"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ExamGroupNode } from "@/lib/types";

type HierarchyState = ExamGroupNode[] | null;

interface SearchResult {
  kind: "Subject" | "Chapter" | "Topic";
  label: string;
  href: string;
  groupSlug: string;
  subjectSlug?: string;
  chapterSlug?: string;
  subChapterSlug?: string;
  topicSlug?: string;
}

/**
 * Global search bar (header).
 *
 * Fetches the full syllabus map from /api/hierarchy and lets the user search
 * across subjects, chapters and topics. Results appear in a dropdown below
 * the bar, each tagged with its kind (Subject / Chapter / Topic).
 *
 * Keyboard: "/" or Cmd/Ctrl+K focuses the input; Esc closes the dropdown.
 */
export default function GlobalSearch() {
  const [tree, setTree] = useState<HierarchyState>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/hierarchy");
        const json = await res.json();
        if (!cancelled) setTree(json.data ?? []);
      } catch {
        if (!cancelled) setTree([]);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts: "/" or Cmd/Ctrl+K to focus, Esc to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "/" && document.activeElement !== inputRef.current) {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const results = useMemoSearch(tree, query);

  return (
    <div className="global-search" ref={containerRef} data-testid="global-search">
      <input
        ref={inputRef}
        type="search"
        className="global-search-input"
        placeholder="Search chapters, topics, concepts..."
        aria-label="Search content"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      <span className="global-search-kbd" aria-hidden="true">
        /
      </span>

      {open && (
        <div className="global-search-dropdown" data-testid="global-search-dropdown">
          {query.trim().length === 0 ? (
            <p className="global-search-hint">Type to search subjects, chapters and topics.</p>
          ) : results.length === 0 ? (
            <p className="global-search-empty">No results found.</p>
          ) : (
            <ul className="global-search-results">
              {results.map((result, index) => (
                <li key={`${result.kind}-${result.href}-${index}`}>
                  <Link
                    href={result.href}
                    className="global-search-result"
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className={`global-search-tag global-search-tag-${result.kind.toLowerCase()}`}>
                      {result.kind}
                    </span>
                    <span className="global-search-label">{result.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function useMemoSearch(tree: HierarchyState, query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];
  for (const group of tree ?? []) {
    for (const subject of group.subjects ?? []) {
      if (subject.name.toLowerCase().includes(q)) {
        results.push({
          kind: "Subject",
          label: subject.name,
          href: `/learn/${group.slug}/${subject.slug}`,
          groupSlug: group.slug,
          subjectSlug: subject.slug,
        });
      }
      for (const chapter of subject.chapters ?? []) {
        if (chapter.name.toLowerCase().includes(q)) {
          results.push({
            kind: "Chapter",
            label: `${subject.name} → ${chapter.name}`,
            href: `/learn/${group.slug}/${subject.slug}/${chapter.slug}`,
            groupSlug: group.slug,
            subjectSlug: subject.slug,
            chapterSlug: chapter.slug,
          });
        }
        for (const sub of chapter.sub_chapters ?? []) {
          for (const topic of sub.topics ?? []) {
            if (topic.name.toLowerCase().includes(q)) {
              results.push({
                kind: "Topic",
                label: `${subject.name} → ${chapter.name} → ${topic.name}`,
                href: `/learn/${group.slug}/${subject.slug}/${chapter.slug}/${sub.slug}/${topic.slug}`,
                groupSlug: group.slug,
                subjectSlug: subject.slug,
                chapterSlug: chapter.slug,
                subChapterSlug: sub.slug,
                topicSlug: topic.slug,
              });
            }
          }
        }
      }
    }
  }

  // Cap at 20 results for a clean dropdown
  return results.slice(0, 20);
}