"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HOME_SECTIONS, type HomeSection } from "@/lib/content-structure";
import type {
  ExamGroupNode,
  SubjectNode,
  ChapterNode,
  SubChapterNode,
  TopicNode,
} from "@/lib/types";

type HierarchyState = ExamGroupNode[] | null;

/**
 * Home-page explorer.
 *
 * Renders the 3 top-level sections (Class 11, Class 12, Knowledge) as
 * expandable cards. Each section opens its sub-sections (e.g. "Class 11
 * notes", "Class 11E", "Class 11 more"), and each sub-section opens the
 * matching subjects -> chapters -> sub-chapters -> topics from the syllabus
 * map.
 *
 * LOCKING RULE: outer navigation is NEVER locked. Users click into any
 * section/sub-section freely. Locks only appear INSIDE content items
 * (the 90% in-content gate handled by ContentItemViewer / LockedSection).
 */
export default function HomeExplorer() {
  const [tree, setTree] = useState<HierarchyState>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedSubSections, setExpandedSubSections] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedSubChapters, setExpandedSubChapters] = useState<Set<string>>(new Set());

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
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="home-explorer" aria-busy="true" data-testid="home-explorer">
        <div className="card-skeleton" />
        <div className="card-skeleton" />
        <div className="card-skeleton" />
      </div>
    );
  }

  return (
    <div className="home-explorer" data-testid="home-explorer">
      {HOME_SECTIONS.map((section) => (
        <HomeSectionCard
          key={section.id}
          section={section}
          tree={tree}
          expandedSections={expandedSections}
          expandedSubSections={expandedSubSections}
          expandedSubjects={expandedSubjects}
          expandedChapters={expandedChapters}
          expandedSubChapters={expandedSubChapters}
          onToggleSection={(id) => toggle(setExpandedSections, id)}
          onToggleSubSection={(id) => toggle(setExpandedSubSections, id)}
          onToggleSubject={(id) => toggle(setExpandedSubjects, id)}
          onToggleChapter={(id) => toggle(setExpandedChapters, id)}
          onToggleSubChapter={(id) => toggle(setExpandedSubChapters, id)}
        />
      ))}
    </div>
  );
}

function HomeSectionCard({
  section,
  tree,
  expandedSections,
  expandedSubSections,
  expandedSubjects,
  expandedChapters,
  expandedSubChapters,
  onToggleSection,
  onToggleSubSection,
  onToggleSubject,
  onToggleChapter,
  onToggleSubChapter,
}: {
  section: HomeSection;
  tree: HierarchyState;
  expandedSections: Set<string>;
  expandedSubSections: Set<string>;
  expandedSubjects: Set<string>;
  expandedChapters: Set<string>;
  expandedSubChapters: Set<string>;
  onToggleSection: (id: string) => void;
  onToggleSubSection: (id: string) => void;
  onToggleSubject: (id: string) => void;
  onToggleChapter: (id: string) => void;
  onToggleSubChapter: (id: string) => void;
}) {
  const open = expandedSections.has(section.id);

  return (
    <section className="home-section" data-testid={`home-section-${section.id}`}>
      <button
        type="button"
        className="home-section-toggle"
        aria-expanded={open}
        onClick={() => onToggleSection(section.id)}
      >
        <span className="home-caret">{open ? "▾" : "▸"}</span>
        <span className="home-section-title">{section.title}</span>
        <span className="home-section-desc">{section.description}</span>
      </button>

      {open && (
        <div className="home-section-body">
          {section.subSections.map((sub) => (
            <SubSectionCard
              key={sub.id}
              sub={sub}
              tree={tree}
              expandedSubSections={expandedSubSections}
              expandedSubjects={expandedSubjects}
              expandedChapters={expandedChapters}
              expandedSubChapters={expandedSubChapters}
              onToggleSubSection={onToggleSubSection}
              onToggleSubject={onToggleSubject}
              onToggleChapter={onToggleChapter}
              onToggleSubChapter={onToggleSubChapter}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SubSectionCard({
  sub,
  tree,
  expandedSubSections,
  expandedSubjects,
  expandedChapters,
  expandedSubChapters,
  onToggleSubSection,
  onToggleSubject,
  onToggleChapter,
  onToggleSubChapter,
}: {
  sub: { id: string; title: string; description: string; groupSlug: string; subjectSlug?: string };
  tree: HierarchyState;
  expandedSubSections: Set<string>;
  expandedSubjects: Set<string>;
  expandedChapters: Set<string>;
  expandedSubChapters: Set<string>;
  onToggleSubSection: (id: string) => void;
  onToggleSubject: (id: string) => void;
  onToggleChapter: (id: string) => void;
  onToggleSubChapter: (id: string) => void;
}) {
  const open = expandedSubSections.has(sub.id);
  const group = (tree ?? []).find((g) => g.slug === sub.groupSlug);
  const subjects = (group?.subjects ?? []).filter(
    (s) => !sub.subjectSlug || s.slug === sub.subjectSlug
  );

  return (
    <div className="home-sub-section" data-testid={`home-sub-section-${sub.id}`}>
      <button
        type="button"
        className="home-sub-toggle"
        aria-expanded={open}
        onClick={() => onToggleSubSection(sub.id)}
      >
        <span className="home-caret">{open ? "▾" : "▸"}</span>
        <span className="home-sub-title">{sub.title}</span>
        <span className="home-sub-desc">{sub.description}</span>
      </button>

      {open && (
        <div className="home-sub-body">
          {subjects.length === 0 ? (
            <p className="home-empty">No content available yet.</p>
          ) : (
            subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                groupSlug={sub.groupSlug}
                expandedSubjects={expandedSubjects}
                expandedChapters={expandedChapters}
                expandedSubChapters={expandedSubChapters}
                onToggleSubject={onToggleSubject}
                onToggleChapter={onToggleChapter}
                onToggleSubChapter={onToggleSubChapter}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SubjectCard({
  subject,
  groupSlug,
  expandedSubjects,
  expandedChapters,
  expandedSubChapters,
  onToggleSubject,
  onToggleChapter,
  onToggleSubChapter,
}: {
  subject: SubjectNode;
  groupSlug: string;
  expandedSubjects: Set<string>;
  expandedChapters: Set<string>;
  expandedSubChapters: Set<string>;
  onToggleSubject: (id: string) => void;
  onToggleChapter: (id: string) => void;
  onToggleSubChapter: (id: string) => void;
}) {
  const open = expandedSubjects.has(subject.slug);

  return (
    <div className="home-subject" data-testid={`home-subject-${subject.slug}`}>
      <button
        type="button"
        className="home-subject-toggle"
        aria-expanded={open}
        onClick={() => onToggleSubject(subject.slug)}
      >
        <span className="home-caret">{open ? "▾" : "▸"}</span>
        <span className="home-subject-name">{subject.name}</span>
      </button>

      {open && (
        <div className="home-subject-body">
          {(subject.chapters ?? []).map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              groupSlug={groupSlug}
              subjectSlug={subject.slug}
              expandedChapters={expandedChapters}
              expandedSubChapters={expandedSubChapters}
              onToggleChapter={onToggleChapter}
              onToggleSubChapter={onToggleSubChapter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChapterCard({
  chapter,
  groupSlug,
  subjectSlug,
  expandedChapters,
  expandedSubChapters,
  onToggleChapter,
  onToggleSubChapter,
}: {
  chapter: ChapterNode;
  groupSlug: string;
  subjectSlug: string;
  expandedChapters: Set<string>;
  expandedSubChapters: Set<string>;
  onToggleChapter: (id: string) => void;
  onToggleSubChapter: (id: string) => void;
}) {
  const open = expandedChapters.has(chapter.slug);

  return (
    <div className="home-chapter" data-testid={`home-chapter-${chapter.slug}`}>
      <button
        type="button"
        className="home-chapter-toggle"
        aria-expanded={open}
        onClick={() => onToggleChapter(chapter.slug)}
      >
        <span className="home-caret">{open ? "▾" : "▸"}</span>
        <span className="home-chapter-name">{chapter.name}</span>
      </button>

      {open && (
        <div className="home-chapter-body">
          {(chapter.sub_chapters ?? []).map((sub) => (
            <SubChapterCard
              key={sub.id}
              sub={sub}
              groupSlug={groupSlug}
              subjectSlug={subjectSlug}
              chapterSlug={chapter.slug}
              expandedSubChapters={expandedSubChapters}
              onToggleSubChapter={onToggleSubChapter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubChapterCard({
  sub,
  groupSlug,
  subjectSlug,
  chapterSlug,
  expandedSubChapters,
  onToggleSubChapter,
}: {
  sub: SubChapterNode;
  groupSlug: string;
  subjectSlug: string;
  chapterSlug: string;
  expandedSubChapters: Set<string>;
  onToggleSubChapter: (id: string) => void;
}) {
  const open = expandedSubChapters.has(sub.slug);

  return (
    <div className="home-sub-chapter" data-testid={`home-sub-chapter-${sub.slug}`}>
      <button
        type="button"
        className="home-sub-chapter-toggle"
        aria-expanded={open}
        onClick={() => onToggleSubChapter(sub.slug)}
      >
        <span className="home-caret">{open ? "▾" : "▸"}</span>
        <span className="home-sub-chapter-name">{sub.name}</span>
      </button>

      {open && (
        <div className="home-sub-chapter-body">
          {(sub.topics ?? []).map((topic) => (
            <TopicLink
              key={topic.id}
              topic={topic}
              groupSlug={groupSlug}
              subjectSlug={subjectSlug}
              chapterSlug={chapterSlug}
              subChapterSlug={sub.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicLink({
  topic,
  groupSlug,
  subjectSlug,
  chapterSlug,
  subChapterSlug,
}: {
  topic: TopicNode;
  groupSlug: string;
  subjectSlug: string;
  chapterSlug: string;
  subChapterSlug: string;
}) {
  const item = topic.content_items?.[0] ?? null;
  const href = item
    ? `/learn/${groupSlug}/${subjectSlug}/${chapterSlug}/${subChapterSlug}/${topic.slug}/${item.id}`
    : `/learn/${groupSlug}/${subjectSlug}/${chapterSlug}/${subChapterSlug}/${topic.slug}`;

  return (
    <Link href={href} className="home-topic" data-testid={`home-topic-${topic.slug}`}>
      <span className="home-topic-name">{topic.name}</span>
      {item && item.access_level < 4 && (
        <span className="badge badge-locked">Tier {item.access_level}+</span>
      )}
    </Link>
  );
}