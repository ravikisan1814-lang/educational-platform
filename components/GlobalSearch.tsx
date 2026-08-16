"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ExamGroupNode } from "@/lib/types";
import { buildSearchIndex, filterSearchHits, type SearchHit } from "@/lib/search-index";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<SearchHit[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/hierarchy");
        const json = await res.json();
        if (!cancelled) {
          setIndex(buildSearchIndex((json.data as ExamGroupNode[]) ?? []));
        }
      } catch {
        if (!cancelled) setIndex([]);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setHits(filterSearchHits(index, query));
    setOpen(query.trim().length > 0);
  }, [query, index]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="global-search" ref={wrapRef}>
      <label className="sr-only" htmlFor="global-search-input">
        Search syllabus
      </label>
      <input
        id="global-search-input"
        type="search"
        className="global-search-input"
        placeholder="Search subject, chapter, topic…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim() && setOpen(true)}
        autoComplete="off"
        spellCheck={false}
      />
      {open && hits.length > 0 && (
        <ul className="global-search-results">
          {hits.map((hit) => (
            <li key={hit.id}>
              <Link
                href={hit.href}
                className="global-search-hit"
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="global-search-hit-label">{hit.label}</span>
                {hit.excerpt && (
                  <span className="global-search-hit-excerpt">{hit.excerpt}</span>
                )}
                <span className="global-search-hit-path">{hit.path}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && hits.length === 0 && (
        <p className="global-search-empty">No matches for &ldquo;{query}&rdquo;</p>
      )}
    </div>
  );
}
