import { getAdminClient } from "@/lib/api-helpers";
import Link from "next/link";

interface ChapterData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  subject_id: string;
  order: number;
}

interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order: number;
}

interface PageProps {
  params: Promise<{ classSlug: string; subjectSlug: string; chapterSlug: string }>;
}

export async function generateStaticParams() {
  const sb = getAdminClient();
  const { data: chapters } = await sb
    .from("chapters")
    .select("slug, subject_id")
    .eq("is_active", true);

  const params = [];
  for (const ch of chapters ?? []) {
    const { data: subject } = await sb
      .from("subjects")
      .select("slug, class_id")
      .eq("id", ch.subject_id)
      .single();
    if (subject) {
      const { data: cls } = await sb
        .from("classes")
        .select("slug")
        .eq("id", subject.class_id)
        .single();
      if (cls) {
        params.push({ classSlug: cls.slug, subjectSlug: subject.slug, chapterSlug: ch.slug });
      }
    }
  }
  return params;
}

export default async function ChapterPage({ params }: PageProps) {
  const { classSlug, subjectSlug, chapterSlug } = await params;
  const sb = getAdminClient();

  const { data: chapterData, error: chapterError } = await sb
    .from("chapters")
    .select("*")
    .eq("slug", chapterSlug)
    .eq("is_active", true)
    .single();

  if (chapterError || !chapterData) {
    return (
      <div className="page-shell">
        <main className="error-page">
          <h1>Chapter Not Found</h1>
          <p>The chapter {chapterSlug} was not found.</p>
          <Link href={`/learn/${classSlug}/${subjectSlug}`} className="btn btn-primary">
            Back to Subject
          </Link>
        </main>
      </div>
    );
  }

  const { data: topics, error: topicsError } = await sb
    .from("topics")
    .select("*")
    .eq("chapter_id", chapterData.id)
    .eq("is_active", true)
    .order("order", { ascending: true });

  return (
    <div className="page-shell">
      <main className="chapter-page">
        <section className="hero">
          <div className="hero-content">
            <span className="hero-badge">Tier 3: Chapter</span>
            <nav className="breadcrumb">
              <Link href={`/class/${classSlug}`}>{classSlug}</Link>
              <span className="breadcrumb-sep">›</span>
              <Link href={`/learn/${classSlug}/${subjectSlug}`}>{subjectSlug}</Link>
              <span className="breadcrumb-sep">›</span>
              <span>{chapterData.title}</span>
            </nav>
            <h1>{chapterData.title}</h1>
            <p>{chapterData.description || "Master this chapter with topics and practice"}</p>
          </div>
        </section>

        <section className="content-section">
          <div className="section-header">
            <h2>Topics</h2>
            <span className="topic-count">{topics?.length || 0} topics</span>
          </div>

          {topicsError ? (
            <div className="error-message">Failed to load topics</div>
          ) : topics && topics.length > 0 ? (
            <div className="topics-list">
              {topics.map((topic: Topic, index: number) => (
                <Link
                  key={topic.id}
                  href={`/learn/${classSlug}/${subjectSlug}/${chapterSlug}/${topic.slug}`}
                  className="topic-card"
                >
                  <div className="topic-number">0{index + 1}</div>
                  <div className="topic-info">
                    <h3>{topic.title}</h3>
                    {topic.description && <p>{topic.description}</p>}
                    <div className="topic-meta">
                      <span className="meta-item">📝 Learning Assets</span>
                      <span className="meta-item">🔧 Formulas</span>
                      <span className="meta-item">✅ PYQs</span>
                    </div>
                  </div>
                  <div className="topic-arrow">→</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No topics available for this chapter yet.</p>
            </div>
          )}
        </section>

        <section className="content-section">
          <h2>Chapter Resources</h2>
          <div className="resource-grid">
            <div className="resource-card">
              <div className="resource-icon">📝</div>
              <h3>Notes</h3>
              <p>Complete chapter notes and summaries</p>
            </div>
            <div className="resource-card">
              <div className="resource-icon">🔧</div>
              <h3>Formulas</h3>
              <p>Key formulas and equations</p>
            </div>
            <div className="resource-card">
              <div className="resource-icon">✅</div>
              <h3>PYQs</h3>
              <p>Previous year questions</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
