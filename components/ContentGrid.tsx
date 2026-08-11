"use client";

import { useEffect, useState } from "react";
import ContentCard from "./ContentCard";
import type { ContentListItem } from "@/lib/types";

const FALLBACK_ITEMS: ContentListItem[] = [
  {
    id: "demo-locked-1",
    category_id: "c1",
    category_slug: "class-11",
    category_name: "Class 11",
    is_locked: true,
    required_access_level: 2,
    title: null,
    description: null,
    masked_title: "Locked content (Member tier)",
    owner_contact: null,
    // Deliberately included to prove frontend masking works:
    // the component must NEVER render this raw URL.
    file_url: "https://storage.example.com/class-11/advanced-notes.pdf",
  },
  {
    id: "demo-locked-2",
    category_id: "c2",
    category_slug: "class-12",
    category_name: "Class 12",
    is_locked: true,
    required_access_level: 3,
    title: null,
    description: null,
    masked_title: "Locked content (Co-member tier)",
    owner_contact: null,
    file_url: "https://storage.example.com/class-12/board-papers.pdf",
  },
  {
    id: "demo-open-1",
    category_id: "c3",
    category_slug: "general-knowledge",
    category_name: "General Knowledge",
    is_locked: false,
    required_access_level: 4,
    title: "Free GK samples",
    description: "Open sample questions for everyone.",
    masked_title: null,
    owner_contact: null,
  },
  {
    id: "demo-open-2",
    category_id: "c4",
    category_slug: "loksewa-knowledge",
    category_name: "Loksewa Knowledge",
    is_locked: false,
    required_access_level: 4,
    title: "Loksewa basics",
    description: "Introductory material, publicly available.",
    masked_title: null,
    owner_contact: null,
  },
];

export default function ContentGrid() {
  const [items, setItems] = useState<ContentListItem[] | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/contents");
        if (!res.ok) throw new Error(`API responded with ${res.status}`);
        const json = (await res.json()) as { data?: ContentListItem[] };
        if (cancelled) return;
        setItems(json.data ?? []);
      } catch {
        if (cancelled) return;
        setDemoMode(true);
        setItems(FALLBACK_ITEMS);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null) {
    return (
      <div className="content-grid" aria-busy="true">
        <div className="card-skeleton" />
        <div className="card-skeleton" />
        <div className="card-skeleton" />
      </div>
    );
  }

  return (
    <div>
      <div className="content-grid">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
      {demoMode && (
        <p className="demo-note">
          Showing demo data — the contents API is not reachable right now.
        </p>
      )}
    </div>
  );
}
